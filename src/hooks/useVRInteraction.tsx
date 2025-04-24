
import { useState, useEffect } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { Vector3 } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3) => void,
  onJoystickMove?: (controllerId: string, value: number) => void
) => {
  const { controllers } = useXR();
  const [activeController, setActiveController] = useState<string | null>(null);

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
      
      // Add joystick event handling
      controller.inputSource?.gamepad?.addEventListener('axes', (event) => {
        if (controller.id === activeController && event.axes && event.axes.length >= 2) {
          // Use y-axis of the joystick for resizing (forward/backward)
          const joystickY = event.axes[1];
          if (Math.abs(joystickY) > 0.1) { // Add a small threshold
            onJoystickMove?.(controller.id, joystickY);
          }
        }
      });
    });

    return () => {
      controllers.forEach(controller => {
        controller.grip.removeEventListener('squeezestart', () => handleControllerEvent(controller, true));
        controller.grip.removeEventListener('squeezeend', () => handleControllerEvent(controller, false));
        
        controller.inputSource?.gamepad?.removeEventListener('axes', () => {});
      });
    };
  }, [controllers, activeController, onGrab, onRelease, onJoystickMove]);

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

  return { activeController };
};
