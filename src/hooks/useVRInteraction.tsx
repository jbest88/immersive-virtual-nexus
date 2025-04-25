
import { useState, useEffect, useRef } from 'react';
import { useXR, XRController } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';

export const useVRInteraction = (
  onGrab?: (controllerId: string, position: Vector3, quaternion: Quaternion) => void,
  onRelease?: (controllerId: string) => void,
  onMove?: (controllerId: string, position: Vector3, pushPull: number, delta: number, quaternion: Quaternion) => void,
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
        onGrab?.(String(controller.id), controller.controller.position, controller.controller.quaternion);
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
        if (!gamepad || gamepad.axes.length < 2) return;

        // Get Y-axis value (using axes[3] with fallback to axes[1])
        const raw = gamepad.axes[3] ?? gamepad.axes[1];
        
        if (Math.abs(raw) < deadzone) {
          onMove?.(controllerId, controller.controller.position, 0, delta, controller.controller.quaternion);
          return;
        }

        // Calculate forward direction from controller
        forwardDirection.current.set(0, 0, -1)
          .applyQuaternion(controller.controller.quaternion);
        
        // Pass the raw*moveSpeed value as pushPull, along with delta and quaternion
        onMove?.(
          controllerId, 
          controller.controller.position, 
          raw * moveSpeed, 
          delta,
          controller.controller.quaternion
        );
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
