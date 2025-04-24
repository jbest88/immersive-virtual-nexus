
import React from 'react';
import * as THREE from 'three';

interface VRControllerProps {
  hand: 'left' | 'right';
  position?: [number, number, number];
  ray?: boolean;
}

// Further simplified component to avoid prop passing issues
const VRController: React.FC<VRControllerProps> = ({ 
  hand, 
  position = [0, 0, 0],
  ray = true
}) => {
  // Create a primitive controller representation
  return (
    <group position={position}>
      {/* Basic controller body */}
      <mesh>
        <boxGeometry args={[0.1, 0.05, 0.2]} />
        <meshStandardMaterial color={hand === 'left' ? '#4a68ff' : '#8a4fff'} />
      </mesh>
      
      {/* Simple trigger button */}
      <mesh position={[0, -0.025, -0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02, 12]} />
        <meshStandardMaterial color="#ff4a4a" />
      </mesh>
      
      {/* Controller pointer ray - rendered as primitive shapes */}
      {ray && (
        <>
          <mesh position={[0, 0, -2]}>
            <cylinderGeometry args={[0.002, 0.002, 4, 8]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent={true} />
          </mesh>
          <mesh position={[0, 0, -4]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
    </group>
  );
};

export default VRController;
