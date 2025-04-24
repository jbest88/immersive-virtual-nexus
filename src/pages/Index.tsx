import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import VRScene from '@/components/VRScene';
import VRMenu from '@/components/VRMenu';
import VRKeyboard from '@/components/VRKeyboard';
import DesktopStream from '@/components/DesktopStream';
import NetworkDisplayComponent from '@/components/NetworkDisplayComponent';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  // State for all VR settings
  const [vrSettings, setVrSettings] = useState({
    screenOpacity: 0.9,
    screenCurvature: 0.2,
    environmentBrightness: 0.7,
    showKeyboard: false,
    enableMultiMonitor: true,
    highPerformanceMode: false,
  });
  
  // State to track the desktop stream
  const [desktopStream, setDesktopStream] = useState<MediaStream | null>(null);
  
  // State to track network streams
  const [networkStreams, setNetworkStreams] = useState<{[peerId: string]: MediaStream}>({});
  
  // Handle settings changes
  const handleSettingChange = (setting: string, value: any) => {
    setVrSettings(prev => ({ ...prev, [setting]: value }));
    
    // Show toast for feedback
    toast({
      title: "Setting Updated",
      description: `${setting} has been updated to ${value}`,
    });
  };
  
  // Handle keyboard input
  const handleKeyPress = (key: string) => {
    console.log("Key pressed:", key);
    // This would send the key to the desktop stream in a real implementation
  };
  
  // Handle stream change from DesktopStream
  const handleStreamChange = (stream: MediaStream | null) => {
    setDesktopStream(stream);
    
    if (stream) {
      toast({
        title: "Desktop Stream Connected",
        description: "Your desktop is now streaming to VR",
      });
    } else {
      toast({
        title: "Desktop Stream Disconnected",
        description: "Stream has been stopped",
      });
    }
  };
  
  // Handle remote network stream
  const handleNetworkStream = (peerId: string, stream: MediaStream | null) => {
    setNetworkStreams(prev => {
      const newStreams = {...prev};
      if (stream) {
        newStreams[peerId] = stream;
      } else {
        delete newStreams[peerId];
      }
      return newStreams;
    });
    
    if (stream) {
      toast({
        title: "Network Stream Connected",
        description: "Remote desktop is now streaming to VR",
      });
    } else {
      toast({
        title: "Network Stream Disconnected",
        description: "Remote desktop stream has ended",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-vr-bg text-vr-text">
      <VRScene 
        environmentBrightness={vrSettings.environmentBrightness}
        enablePerformanceMonitor={vrSettings.highPerformanceMode}
      />
      
      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 bg-vr-panel/30 backdrop-blur-md flex items-center justify-between px-6 py-3 z-30">
        <h1 className="text-xl font-bold vr-glow">Immersive Virtual Desktop</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${Object.keys(networkStreams).length > 0 ? 'bg-blue-400 animate-pulse' : (desktopStream ? 'bg-green-400 animate-pulse' : 'bg-red-400')}`}></span>
            <span className="text-sm">
              {Object.keys(networkStreams).length > 0 
                ? 'Network Connected' 
                : (desktopStream ? 'Desktop Connected' : 'Disconnected')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Virtual Keyboard (conditionally rendered based on settings) */}
      {vrSettings.showKeyboard && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl">
          <VRKeyboard onKeyPress={handleKeyPress} />
        </div>
      )}
      
      {/* Settings menu */}
      <VRMenu 
        settings={vrSettings}
        onSettingChange={handleSettingChange}
        desktopStream={desktopStream}
        networkStreams={networkStreams}
        onStreamChange={handleStreamChange}
        onNetworkStream={handleNetworkStream}
      />
      
      {/* Information panel */}
      <div className="absolute bottom-6 left-6 z-30 vr-panel p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Virtual Desktop Experience</h2>
        <p className="text-sm text-vr-text/90 mb-3">
          This application demonstrates a VR desktop environment that allows you to view and interact 
          with your computer screens in virtual reality. You can connect to desktops on your local network.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Move Screen</span>
            <span className="text-vr-text/80">Grab + Drag</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Resize Screen</span>
            <span className="text-vr-text/80">Grab Corners</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Toggle Menu</span>
            <span className="text-vr-text/80">Left Controller + B</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Reset View</span>
            <span className="text-vr-text/80">Both Triggers + Y</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
