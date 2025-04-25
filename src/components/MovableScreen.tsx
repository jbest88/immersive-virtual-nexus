
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, useController } from '@react-three/xr';
import * as THREE from 'three';

interface MovableScreenProps {
  children: React.ReactNode;
  onPositionUpdate?: (position: [number, number, number]) => void;
}

export const MovableScreen: React.FC<MovableScreenProps> = ({ 
  children,
  onPositionUpdate 
}) => {
  const mesh = useRef<THREE.Group>(null!);
  const { player } = useXR();
  const controller = useController('right') || useController('left');

  const [isGripped, setIsGripped] = useState(false);
  const grabOffset = useRef(new THREE.Vector3());
  const pullOffset = useRef(new THREE.Vector3());
  
  // Define event handlers with useCallback to maintain reference stability
  const handleSqueezeStart = useCallback(() => {
    if (!controller || !mesh.current) return;

    const ctrlPos = new THREE.Vector3();
    controller.controller.getWorldPosition(ctrlPos);
    
    const objPos = new THREE.Vector3();
    mesh.current.getWorldPosition(objPos);
    
    grabOffset.current.copy(objPos.sub(ctrlPos));
    pullOffset.current.set(0, 0, 0);
    setIsGripped(true);
  }, [controller]);

  const handleSqueezeEnd = useCallback(() => {
    setIsGripped(false);
  }, []);

  // Setup the controller event listeners
  useEffect(() => {
    // Exit early if controller doesn't exist
    if (!controller || !controller.grip) return;
    
    console.log("Setting up controller event listeners");
    
    // Add event listeners
    controller.grip.addEventListener('squeezestart', handleSqueezeStart);
    controller.grip.addEventListener('squeezeend', handleSqueezeEnd);
    
    // Cleanup function to remove event listeners
    return () => {
      if (controller && controller.grip) {
        controller.grip.removeEventListener('squeezestart', handleSqueezeStart);
        controller.grip.removeEventListener('squeezeend', handleSqueezeEnd);
      }
    };
  }, [controller, handleSqueezeStart, handleSqueezeEnd]);

  // Handle controller movement and screen positioning
  useFrame((_, delta) => {
    if (!isGripped || !controller || !mesh.current) return;

    // Handle joystick push/pull
    if (controller.inputSource?.gamepad) {
      const gp = controller.inputSource.gamepad;
      
      // Safely check if axes exist and have enough elements
      if (gp.axes && gp.axes.length > 0) {
        // Use index 3 if available (primary axis), otherwise fall back to index 1
        const axisIndex = (gp.axes.length > 3) ? 3 : (gp.axes.length > 1 ? 1 : 0);
        const raw = gp.axes[axisIndex];
        const deadzone = 0.15;
        
        if (Math.abs(raw) > deadzone) {
          // Calculate forward direction from controller orientation
          const forward = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(controller.controller.quaternion);
          const speed = 1.5;
          pullOffset.current.addScaledVector(forward, raw * speed * delta);
        }
      }
    }

    // Update position: controllerPos + grabOffset + pullOffset
    const ctrlPos = new THREE.Vector3();
    controller.controller.getWorldPosition(ctrlPos);
    
    const targetPos = ctrlPos.clone()
      .add(grabOffset.current)
      .add(pullOffset.current);
    
    mesh.current.position.copy(targetPos);

    // Make screen face the controller
    const direction = new THREE.Vector3().subVectors(
      controller.controller.position,
      mesh.current.position
    );
    direction.y = 0; // Keep screen vertical
    mesh.current.lookAt(mesh.current.position.clone().add(direction));

    // Notify position updates
    if (onPositionUpdate) {
      onPositionUpdate([targetPos.x, targetPos.y, targetPos.z]);
    }
  });

  return <group ref={mesh}>{children}</group>;
};
