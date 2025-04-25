
import { useState, useEffect, useRef } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3) => void,
  onJoystickMove?: (controllerId: string, x: number, y: number) => void
) => {
  const { controllers } = useXR();
  const [activeController, setActiveController] = useState<string | null>(null);
  const joystickThreshold = 0.1;

  // Handle grip button events
  useEffect(() => {
    const handleControllerEvent = (controller: XRController, isGrip: boolean) => {
      if (isGrip) {
        setActiveController(String(controller.id));
        onGrab?.(String(controller.id), controller.controller.position);
      } else if (String(controller.id) === activeController) {
        setActiveController(null);
        onRelease?.(String(controller.id));
      }
    };

    controllers.forEach(controller => {
      controller.grip.addEventListener('squeezestart', () => handleControllerEvent(controller, true));
      controller.grip.addEventListener('squeezeend', () => handleControllerEvent(controller, false));
    });

    return () => {
      controllers.forEach(controller => {
        controller.grip.removeEventListener('squeezestart', () => handleControllerEvent(controller, true));
        controller.grip.removeEventListener('squeezeend', () => handleControllerEvent(controller, false));
      });
    };
  }, [controllers, activeController, onGrab, onRelease]);

  // Handle controller movement
  useFrame(() => {
    if (activeController) {
      const controller = controllers.find(c => String(c.id) === activeController);
      if (controller) {
        onMove?.(String(controller.id), controller.controller.position);
        
        // Handle joystick input
        if (controller.inputSource?.gamepad) {
          const gamepad = controller.inputSource.gamepad;
          if (gamepad.axes && gamepad.axes.length >= 4) {
            const joystickX = gamepad.axes[2]; // Right joystick X
            const joystickY = gamepad.axes[3]; // Right joystick Y
            
            if (Math.abs(joystickX) > joystickThreshold || Math.abs(joystickY) > joystickThreshold) {
              onJoystickMove?.(String(controller.id), joystickX, joystickY);
            }
          }
        }
      }
    }
  });

  return { activeController };
};
