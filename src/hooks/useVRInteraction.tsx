
import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Create stable callback references
  const handleControllerGrip = useCallback((controller: XRController, isGrip: boolean) => {
    if (!controller) return;
    
    const controllerId = String(controller.id);
    
    if (isGrip) {
      setActiveController(controllerId);
      onGrab?.(controllerId, controller.controller.position, controller.controller.quaternion);
    } else if (controllerId === activeController) {
      setActiveController(null);
      onRelease?.(controllerId);
    }
  }, [activeController, onGrab, onRelease]);

  // Handle grip button events
  useEffect(() => {
    if (!controllers || controllers.length === 0) return;
    
    // Add event listeners
    controllers.forEach(controller => {
      if (controller && controller.grip) {
        const gripStart = () => handleControllerGrip(controller, true);
        const gripEnd = () => handleControllerGrip(controller, false);
        
        controller.grip.addEventListener('squeezestart', gripStart);
        controller.grip.addEventListener('squeezeend', gripEnd);
        
        return () => {
          if (controller && controller.grip) {
            controller.grip.removeEventListener('squeezestart', gripStart);
            controller.grip.removeEventListener('squeezeend', gripEnd);
          }
        };
      }
    });
  }, [controllers, handleControllerGrip]);

  // Track joystick movement and button presses
  useFrame((_, delta) => {
    if (!controllers || controllers.length === 0) return;
    
    controllers.forEach(controller => {
      if (!controller) return;
      
      const controllerId = String(controller.id);
      
      // Handle controller movement if it's the active controller
      if (activeController === controllerId) {
        const gamepad = controller.inputSource?.gamepad;
        if (!gamepad || !gamepad.axes || gamepad.axes.length < 2) {
          // If there's no movement data, still call onMove with zero pushPull
          onMove?.(controllerId, controller.controller.position, 0, delta, controller.controller.quaternion);
          return;
        }

        // Get Y-axis value (using axes[3] with fallback to axes[1])
        const axisIndex = (gamepad.axes.length > 3) ? 3 : 1;
        const raw = gamepad.axes[axisIndex];
        
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
        
        if (!gamepad.buttons || gamepad.buttons.length === 0) return;
        
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
