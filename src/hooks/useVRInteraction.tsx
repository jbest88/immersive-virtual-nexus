
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
        // Pass the controller position for natural movement
        const gamepad = controller.inputSource?.gamepad;
        if (gamepad) {
          // Get the Y-axis of right joystick (axes[3]) for push/pull
          const joystickY = gamepad.axes[3] || 0;
          const pushPullValue = Math.abs(joystickY) > joystickThreshold ? joystickY * pushPullSpeed : 0;
          
          // Call onMove with controller position and push/pull value
          onMove?.(controllerId, controller.controller.position, pushPullValue);
        } else {
          // If no gamepad, just use controller position with no push/pull
          onMove?.(controllerId, controller.controller.position, 0);
        }
      }
      
      // Handle button presses (for menu toggle with B button and other interactions)
      if (controller.inputSource?.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        
        // Initialize controller state if not exists
        if (!lastButtonStates.current[controllerId]) {
          lastButtonStates.current[controllerId] = {};
        }
        
        // Check each button for changes
        for (let i = 0; i < gamepad.buttons.length; i++) {
          const isPressed = gamepad.buttons[i].pressed;
          const wasPressed = lastButtonStates.current[controllerId][i] || false;
          
          // If button state changed from not pressed to pressed (button down)
          if (isPressed && !wasPressed) {
            // Map button index to name - this varies by controller, but index 1 is typically B/Y
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
            
            // Trigger the callback with button info
            onButtonPress?.(controllerId, buttonName);
            console.log(`Button pressed: ${buttonName} on controller ${controllerId}`);
          }
          
          // Update button state
          lastButtonStates.current[controllerId][i] = isPressed;
        }
      }
    });
  });

  return { activeController };
};
