
import { useState, useEffect, useRef } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3, pushPull: number) => void,
  onButtonPress?: (controllerId: string, buttonName: string) => void,
) => {
  const { controllers } = useXR();
  const [activeController, setActiveController] = useState<string | null>(null);
  const joystickThreshold = 0.1;
  const pushPullSpeed = 0.05; // Speed multiplier for push/pull
  const lastButtonStates = useRef<{[key: string]: {[key: string]: boolean}}>({});
  const pushPullDirection = useRef<Vector3>(new Vector3());

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

  // Track button presses and joystick movement for each controller
  useFrame(() => {
    controllers.forEach(controller => {
      const controllerId = String(controller.id);
      
      // Handle controller movement if it's the active controller
      if (activeController === controllerId) {
        const gamepad = controller.inputSource?.gamepad;
        if (gamepad) {
          // Get the Y-axis of right joystick (axes[3]) for push/pull
          const joystickY = gamepad.axes[3] || 0;
          
          if (Math.abs(joystickY) > joystickThreshold) {
            // Calculate push/pull direction based on controller's forward direction
            pushPullDirection.current.set(0, 0, -1)
              .applyQuaternion(controller.controller.quaternion)
              .normalize()
              .multiplyScalar(joystickY * pushPullSpeed);
            
            // Update position based on continuous joystick input
            const newPosition = controller.controller.position.clone().add(pushPullDirection.current);
            onMove?.(controllerId, newPosition, joystickY * pushPullSpeed);
          } else {
            // If joystick is neutral, just pass the current position
            onMove?.(controllerId, controller.controller.position, 0);
          }
        } else {
          onMove?.(controllerId, controller.controller.position, 0);
        }
      }
      
      // Handle button presses
      if (controller.inputSource?.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        
        if (!lastButtonStates.current[controllerId]) {
          lastButtonStates.current[controllerId] = {};
        }
        
        for (let i = 0; i < gamepad.buttons.length; i++) {
          const isPressed = gamepad.buttons[i].pressed;
          const wasPressed = lastButtonStates.current[controllerId][i] || false;
          
          if (isPressed && !wasPressed) {
            let buttonName = '';
            switch (i) {
              case 0: buttonName = 'A'; break;
              case 1: buttonName = 'B'; break;
              case 2: buttonName = 'X'; break;
              case 3: buttonName = 'Y'; break;
              case 4: buttonName = 'L1'; break;
              case 5: buttonName = 'R1'; break;
              default: buttonName = `Button${i}`; break;
            }
            
            onButtonPress?.(controllerId, buttonName);
          }
          
          lastButtonStates.current[controllerId][i] = isPressed;
        }
      }
    });
  });

  return { activeController };
};
