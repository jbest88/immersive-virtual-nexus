
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, Environment, OrbitControls, Text } from '@react-three/drei';
import { VRButton, XR, Controllers, Hands, useXR } from '@react-three/xr';
import * as THREE from 'three';
import { Perf } from 'r3f-perf';

import VirtualScreen from '../models/VirtualScreen';
import screenCaptureService from '../services/screenCaptureService';
import webRTCService from '../services/webrtcService';
import NetworkDisplayComponent from './NetworkDisplayComponent';
import { toast } from '@/components/ui/use-toast';
import { useVRInteraction } from '../hooks/useVRInteraction';

interface VRSceneProps {
  environmentBrightness?: number;
  enablePerformanceMonitor?: boolean;
}

// SceneSetup component
const SceneSetup: React.FC<{ environmentBrightness: number }> = ({ environmentBrightness }) => {
  const { scene } = useThree();
  
  React.useEffect(() => {
    scene.fog = new THREE.FogExp2('#070723', 0.03);
    scene.background = new THREE.Color('#070723');
  }, [scene]);
  
  return (
    <>
      <ambientLight intensity={0.4 * environmentBrightness} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.5 * environmentBrightness} 
        castShadow 
      />
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.5}
        azimuth={0.25}
      />
      <Environment preset="night" background={false} />
      
      {/* Floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#1a1a4a" 
          opacity={0.6} 
          transparent={true}
          wireframe={true} 
        />
      </mesh>
    </>
  );
};

// VR Session Detection with Menu Controls
const VRSessionDetection = ({ toggleMenu }: { toggleMenu: () => void }) => {
  const { isPresenting } = useXR();
  
  useEffect(() => {
    if (isPresenting) {
      console.log("VR Session started");
      toast({
        title: "VR Mode Activated",
        description: "Use B button to toggle the menu. Use controllers to interact with screens."
      });
    }
  }, [isPresenting]);
  
  // Setup button handling for menu toggle
  const handleButtonPress = (controllerId: string, buttonName: string) => {
    console.log(`Button pressed in VR: ${buttonName}`);
    if (buttonName === 'B') {
      console.log("B button pressed - toggling menu");
      toggleMenu();
    }
  };
  
  useVRInteraction(undefined, undefined, undefined, handleButtonPress);
  
  return null;
};

const VRScene: React.FC<VRSceneProps> = ({ 
  environmentBrightness = 0.7,
  enablePerformanceMonitor = false,
}) => {
  // Setup virtual screen data
  const [screens] = useState<Array<{
    id: number;
    position: [number, number, number];
    width: number;
    height: number;
    name: string;
    stream: MediaStream | null;
    sourceType: 'local' | 'remote';
    sourceId: string;
  }>>([
    { id: 1, position: [-5, 1, -5], width: 16, height: 9, name: "Main Display", stream: null, sourceType: 'local', sourceId: 'display-1' },
    { id: 2, position: [5, 1, -5], width: 10, height: 8, name: "Remote Desktop", stream: null, sourceType: 'remote', sourceId: '' },
  ]);
  
  // State to track active streams
  const [activeStreams, setActiveStreams] = useState<Map<number, MediaStream>>(new Map());
  const [webrtcInitialized, setWebrtcInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const vrButtonRef = useRef<HTMLButtonElement>(null);
  const [showVRMenu, setShowVRMenu] = useState(false);
  
  // Toggle VR menu function for button press
  const toggleVRMenu = () => {
    console.log("Toggling VR menu visibility:", !showVRMenu);
    setShowVRMenu(prev => !prev);
    
    toast({
      title: showVRMenu ? "Menu Hidden" : "Menu Shown",
      description: showVRMenu ? "Menu is now hidden" : "Use controller to interact with menu"
    });
  };
  
  // Initialize WebRTC for remote screen streaming
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        // Simple mock initialization for demo purposes
        // In a real implementation, we would connect to a real signaling server
        console.log("Initializing WebRTC service...");
        setWebrtcInitialized(true);
        setConnectionError(null);
        
        toast({
          title: "Network Ready",
          description: "Ready to connect to desktop streams"
        });
      } catch (error) {
        console.error("Failed to initialize WebRTC:", error);
        setConnectionError("Network initialization failed. Try again later.");
        
        toast({
          title: "Network Error",
          description: "Failed to connect to streaming network",
          variant: "destructive"
        });
      }
    };
    
    initWebRTC();
    
    return () => {
      // Cleanup code
      console.log("Cleaning up WebRTC connections");
      webRTCService.cleanup();
    };
  }, []);
  
  // Handle stream assignment to a screen
  const assignStreamToScreen = (screenId: number, stream: MediaStream | null) => {
    setActiveStreams(prev => {
      const newStreams = new Map(prev);
      
      if (stream) {
        newStreams.set(screenId, stream);
      } else {
        newStreams.delete(screenId);
      }
      
      return newStreams;
    });
  };
  
  // Handle remote stream from WebRTC
  const handleRemoteStream = (peerId: string, stream: MediaStream | null) => {
    console.log("Received remote stream:", peerId, stream ? "active" : "null");
    
    // Find screen configured for remote display
    const remoteScreen = screens.find(s => s.sourceType === 'remote');
    if (remoteScreen) {
      // If we got a stream, assign it to the screen
      // Otherwise, clear the stream
      assignStreamToScreen(remoteScreen.id, stream);
      
      // Update the source ID if we have a new stream
      if (stream) {
        remoteScreen.sourceId = peerId;
        toast({
          title: "Stream Received",
          description: `Desktop stream connected to ${remoteScreen.name}`
        });
      } else if (remoteScreen.sourceId === peerId) {
        remoteScreen.sourceId = '';
        toast({
          title: "Stream Ended",
          description: `Remote desktop stream disconnected`
        });
      }
    }
  };
  
  // Custom VR button handler
  const handleVRButtonClick = () => {
    if (!webrtcInitialized) {
      toast({
        title: "VR Not Ready",
        description: "Please wait for network initialization to complete",
        variant: "destructive"
      });
      return;
    }
    
    // Forward click to the original VR button
    if (vrButtonRef.current) {
      vrButtonRef.current.click();
    }
  };
  
  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      screenCaptureService.stopAllCaptures();
      webRTCService.cleanup();
    };
  }, []);
  
  return (
    <div className="absolute inset-0 vr-gradient-bg">
      <div className="hidden">
        <VRButton ref={vrButtonRef} className="absolute" />
      </div>
      
      {/* Custom VR Button */}
      <button 
        onClick={handleVRButtonClick}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-vr-accent text-white font-bold rounded-lg hover:bg-vr-accent/80 transition-all flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 14V8a4 4 0 0 1 8 0v6M3 14h18v0a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v0Z"/>
          <path d="M10 17v.01M14 17v.01"/>
        </svg>
        Enter VR
      </button>
      
      {connectionError && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-red-500/80 text-white rounded-md">
          {connectionError}
        </div>
      )}
      
      <Canvas shadows camera={{ position: [0, 1.7, 0], fov: 70 }}>
        <XR>
          {/* VR Session Detection with Menu Toggle */}
          <VRSessionDetection toggleMenu={toggleVRMenu} />
          
          {/* Performance monitor for development */}
          {enablePerformanceMonitor && <Perf position="top-left" />}
          
          {/* Scene environment */}
          <SceneSetup environmentBrightness={environmentBrightness} />
          
          {/* Virtual screens */}
          {screens.map((screen) => (
            <VirtualScreen
              key={screen.id}
              position={screen.position}
              width={screen.width}
              height={screen.height}
              name={screen.name}
              videoStream={activeStreams.get(screen.id) || null}
            />
          ))}
          
          {/* VR Menu (will be displayed in 3D space when toggled) */}
          {showVRMenu && (
            <group position={[0, 1.5, -1]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1, 0.6]} />
                <meshBasicMaterial color="#112244" opacity={0.8} transparent />
              </mesh>
              <Text
                position={[0, 0.2, 0.01]}
                fontSize={0.05}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                VR Menu
              </Text>
              <Text
                position={[0, 0.1, 0.01]}
                fontSize={0.03}
                color="#aaddff"
                anchorX="center"
                anchorY="middle"
              >
                Grip screens to move them
              </Text>
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.03}
                color="#aaddff"
                anchorX="center"
                anchorY="middle"
              >
                Use joystick to push/pull
              </Text>
              <Text
                position={[0, -0.1, 0.01]}
                fontSize={0.03}
                color="#aaddff"
                anchorX="center"
                anchorY="middle"
              >
                Press B again to close menu
              </Text>
            </group>
          )}
          
          {/* VR Controllers and Hands */}
          <Controllers />
          <Hands />
          
          {/* Non-VR Camera controls */}
          <OrbitControls 
            target={[0, 1, -3]}
            maxPolarAngle={Math.PI / 1.75}
            minDistance={1}
            maxDistance={20}
          />
        </XR>
      </Canvas>
      
      {/* Network Display Component (hidden in VR mode) */}
      <div className="absolute top-4 right-4 z-30 w-80 pointer-events-auto">
        <NetworkDisplayComponent
          onStreamReceived={handleRemoteStream}
        />
      </div>
      
      {/* Screen Stream Control Panel (hidden in VR mode) */}
      <div className="absolute top-4 left-4 z-30 vr-panel p-4 w-72 pointer-events-auto hidden md:block">
        <h3 className="text-lg font-semibold mb-3 text-vr-accent">Stream Control</h3>
        <p className="text-sm mb-3 text-vr-text/70">
          Select which monitor to stream to each virtual screen
        </p>
        
        <div className="space-y-2">
          {screens.filter(screen => screen.sourceType === 'local').map(screen => (
            <div key={screen.id} className="p-2 bg-vr-primary/10 rounded">
              <p className="text-sm font-medium text-vr-accent mb-2">{screen.name}</p>
              <button
                className="w-full p-2 bg-vr-accent/20 hover:bg-vr-accent/30 rounded text-sm flex justify-between items-center"
                onClick={() => {
                  // This would open a device selector in a real app
                  // For now, we'll simulate selecting the first display
                  screenCaptureService.captureScreen(`display-${screen.id}`).then(stream => {
                    if (stream) {
                      assignStreamToScreen(screen.id, stream);
                    }
                  });
                }}
              >
                <span>Stream Display to {screen.name}</span>
                <div className={`w-2 h-2 rounded-full ${activeStreams.has(screen.id) ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VRScene;
