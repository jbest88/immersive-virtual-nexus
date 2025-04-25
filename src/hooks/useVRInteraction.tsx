
import { useState, useEffect, useRef } from 'react';
import { useXR, XRController, useController } from '@react-three/xr';
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
  const deadzone = 0.15; // Joystick deadzone
  const moveSpeed = 1.5; // meters per second
  const lastButtonStates = useRef<{[key: string]: {[key: string]: boolean}}>({});
  const forwardDirection = useRef<Vector3>(new Vector3());

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

  // Track joystick movement and button presses
  useFrame((_, delta) => {
    controllers.forEach(controller => {
      const controllerId = String(controller.id);
      
      // Handle controller movement if it's the active controller
      if (activeController === controllerId) {
        const gamepad = controller.inputSource?.gamepad;
        if (gamepad) {
          // Get the Y-axis of right joystick (axes[3]) for push/pull
          const yAxis = gamepad.axes[3] ?? gamepad.axes[1];
          
          if (Math.abs(yAxis) > deadzone) {
            // Calculate push/pull direction based on controller's forward direction
            forwardDirection.current.set(0, 0, -1)
              .applyQuaternion(controller.controller.quaternion);

            // Calculate new position based on continuous movement
            const newPosition = controller.controller.position.clone()
              .add(forwardDirection.current.multiplyScalar(yAxis * moveSpeed * delta));
            
            onMove?.(controllerId, newPosition, yAxis * moveSpeed);
          } else {
            onMove?.(controllerId, controller.controller.position, 0);
          }
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
