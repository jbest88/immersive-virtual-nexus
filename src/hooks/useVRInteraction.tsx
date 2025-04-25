
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
        // Make sure controller.id is treated as a string
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
  useEffect(() => {
    if (activeController) {
      // Use String() to ensure consistent comparison with activeController
      const controller = controllers.find(c => String(c.id) === activeController);
      if (controller) {
        const handleMove = () => {
          // Ensure controller.id is treated as a string
          onMove?.(String(controller.id), controller.controller.position);
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
        // Ensure consistent string comparison
        if (String(controller.id) === activeController && controller.inputSource?.gamepad) {
          const gamepad = controller.inputSource.gamepad;
          // Check axes (usually axes[1] is the Y axis of the main joystick)
          if (gamepad.axes && gamepad.axes.length >= 2) {
            const joystickY = gamepad.axes[1];
            // Only trigger if joystick moved beyond threshold
            if (Math.abs(joystickY) > joystickThreshold) {
              // Make sure controller.id is passed as a string
              onJoystickMove?.(String(controller.id), joystickY);
            }
          }
        }
      });
    }
  });

  return { activeController };
};
