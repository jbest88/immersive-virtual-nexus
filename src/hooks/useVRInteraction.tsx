
import { useState, useEffect } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { Vector3 } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3) => void
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
    });

    return () => {
      controllers.forEach(controller => {
        controller.grip.removeEventListener('squeezestart', () => handleControllerEvent(controller, true));
        controller.grip.removeEventListener('squeezeend', () => handleControllerEvent(controller, false));
      });
    };
  }, [controllers, activeController, onGrab, onRelease]);

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
