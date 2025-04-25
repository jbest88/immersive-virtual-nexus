
import { useRef, useState, useEffect } from 'react';
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

  // Fix: Added the proper dependencies array and made sure every event uses .grip
  useEffect(() => {
    if (!controller) return undefined;

    const onSqueezeStart = () => {
      const ctrlPos = new THREE.Vector3();
      controller.controller.getWorldPosition(ctrlPos);
      const objPos = new THREE.Vector3();
      mesh.current.getWorldPosition(objPos);
      grabOffset.current.copy(objPos.sub(ctrlPos));
      pullOffset.current.set(0, 0, 0);
      setIsGripped(true);
    };

    const onSqueezeEnd = () => {
      setIsGripped(false);
    };

    // Using grip instead of controller directly to access the XR events
    controller.grip.addEventListener('squeezestart', onSqueezeStart);
    controller.grip.addEventListener('squeezeend', onSqueezeEnd);
    
    return () => {
      controller.grip.removeEventListener('squeezestart', onSqueezeStart);
      controller.grip.removeEventListener('squeezeend', onSqueezeEnd);
    };
  }, [controller]); // Explicitly passing controller to dependencies

  useFrame((_, delta) => {
    if (!isGripped || !controller || !mesh.current) return;

    // Handle joystick push/pull
    const gp = controller.inputSource?.gamepad;
    if (gp?.axes) {
      const raw = gp.axes[3] ?? gp.axes[1];
      const deadzone = 0.15;
      if (Math.abs(raw) > deadzone) {
        // Using controller.controller.quaternion instead of targetRaySpace
        const forward = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(controller.controller.quaternion);
        const speed = 1.5;
        pullOffset.current.addScaledVector(forward, raw * speed * delta);
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
