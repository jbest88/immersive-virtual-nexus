
import React, { useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, Environment, OrbitControls } from '@react-three/drei';
import { VRButton, XR, Controllers, Hands } from '@react-three/xr';
import * as THREE from 'three';
import { Perf } from 'r3f-perf';

import VirtualScreen from '../models/VirtualScreen';
import VRController from './VRController';

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
  }>>([
    { id: 1, position: [-5, 1, -5], width: 16, height: 9, name: "Main Display" },
    { id: 2, position: [5, 1, -5], width: 10, height: 8, name: "Secondary Monitor" },
  ]);
  
  return (
    <div className="absolute inset-0 vr-gradient-bg">
      <VRButton className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50" />
      <Canvas shadows camera={{ position: [0, 1.7, 0], fov: 70 }}>
        <XR>
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
            />
          ))}
          
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
    </div>
  );
};

export default VRScene;

