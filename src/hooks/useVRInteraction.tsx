
import { useState, useEffect, useRef } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3) => void,
  onJoystickMove?: (controllerId: string, value: number) => void
) => {
  const { controllers } = useXR();
  const [activeController, setActiveController] = useState<string | null>(null);
  const joystickThreshold = 0.1; // Minimum joystick movement to trigger resize

  // Setup event handlers for grip buttons (grab/release)
  useEffect(() => {
    const handleControllerEvent = (controller: XRController, isGrip: boolean) => {
      if (isGrip) {
        setActiveController(controller.id);
        onGrab?.(controller.id, controller.controller.position);
      } else if (controller.id === activeController) {
        setActiveController(null);
        onRelease?.(controller.id);
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
  useEffect(() => {
    if (activeController) {
      const controller = controllers.find(c => c.id === activeController);
      if (controller) {
        const handleMove = () => {
          onMove?.(controller.id, controller.controller.position);
        };

        controller.controller.addEventListener('move', handleMove);
        return () => controller.controller.removeEventListener('move', handleMove);
      }
    }
  }, [activeController, controllers, onMove]);

  // Read gamepad input on each frame for joystick values
  useFrame(() => {
    if (activeController) {
      controllers.forEach(controller => {
        if (controller.id === activeController && controller.inputSource?.gamepad) {
          const gamepad = controller.inputSource.gamepad;
          // Check axes (usually axes[1] is the Y axis of the main joystick)
          if (gamepad.axes && gamepad.axes.length >= 2) {
            const joystickY = gamepad.axes[1];
            // Only trigger if joystick moved beyond threshold
            if (Math.abs(joystickY) > joystickThreshold) {
              onJoystickMove?.(controller.id, joystickY);
            }
          }
        }
      });
    }
  });

  return { activeController };
};
