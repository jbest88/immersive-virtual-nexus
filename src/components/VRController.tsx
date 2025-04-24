
import React from 'react';
import * as THREE from 'three';

interface VRControllerProps {
  hand: 'left' | 'right';
  position?: [number, number, number];
  ray?: boolean;
}

// This is a simplified component that minimizes Three.js prop passing issues
const VRController: React.FC<VRControllerProps> = ({ 
  hand, 
  position = [0, 0, 0],
  ray = true
}) => {
  // Create a simple controller visualization without complex nested objects
  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Placeholder controller visualization */}
      <mesh>
        <boxGeometry args={[0.1, 0.05, 0.2]} />
        <meshStandardMaterial color={hand === 'left' ? '#4a68ff' : '#8a4fff'} />
      </mesh>
      
      {/* Trigger button area - simplified */}
      <mesh position={[0, -0.025, -0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02, 12]} />
        <meshStandardMaterial color="#ff4a4a" />
      </mesh>
      
      {/* Controller ray for pointing - simplified */}
      {ray && (
        <>
          <mesh position={[0, 0, -2]}>
            <cylinderGeometry args={[0.002, 0.002, 4, 8]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
          <mesh position={[0, 0, -4]}>
            <sphereGeometry args={[0.01, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
    </group>
  );
};

export default VRController;
