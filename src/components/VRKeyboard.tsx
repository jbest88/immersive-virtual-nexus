
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VRKeyboardProps {
  onKeyPress: (key: string) => void;
  className?: string;
}

const VRKeyboard: React.FC<VRKeyboardProps> = ({ onKeyPress, className }) => {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsLockActive, setIsCapsLockActive] = useState(false);
  
  const keyboardRows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Menu', 'Ctrl']
  ];
  
  const shiftMap: Record<string, string> = {
    '`': '~', '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', 
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+',
    '[': '{', ']': '}', '\\': '|', ';': ':', '\'': '"', ',': '<', '.': '>', '/': '?'
  };
  
  const handleKeyPress = (key: string) => {
    switch(key) {
      case 'Shift':
        setIsShiftActive(!isShiftActive);
        break;
      case 'Caps':
        setIsCapsLockActive(!isCapsLockActive);
        break;
      case 'Space':
        onKeyPress(' ');
        break;
      default:
        let output = key;
        
        // Apply shift transformations
        if (isShiftActive && key in shiftMap) {
          output = shiftMap[key];
        }
        
        // Apply case transformations for letters
        if (key.length === 1 && key.match(/[a-z]/i)) {
          if ((isShiftActive && !isCapsLockActive) || (!isShiftActive && isCapsLockActive)) {
            output = key.toUpperCase();
          } else {
            output = key.toLowerCase();
          }
        }
        
        onKeyPress(output);
        
        // Turn off shift after a keypress if it's active
        if (isShiftActive) {
          setIsShiftActive(false);
        }
    }
  };
  
  const getKeyClass = (key: string) => {
    let baseClass = "text-white rounded m-0.5 transition-all";
    
    // Special styling for special keys
    switch (key) {
      case 'Space':
        return cn(baseClass, "col-span-6 bg-vr-panel/70 hover:bg-vr-panel");
      case 'Backspace':
      case 'Enter':
        return cn(baseClass, "col-span-2 bg-vr-secondary/80 hover:bg-vr-secondary");
      case 'Tab':
      case 'Caps':
        return cn(baseClass, "col-span-2 bg-vr-panel/70 hover:bg-vr-panel");
      case 'Shift':
        return cn(baseClass, "col-span-2 bg-vr-panel/70 hover:bg-vr-panel", 
          isShiftActive ? "bg-vr-primary" : "");
      case 'Ctrl':
      case 'Alt':
      case 'Win':
      case 'Menu':
        return cn(baseClass, "bg-vr-panel/70 hover:bg-vr-panel");
      default:
        return cn(baseClass, "bg-vr-panel/50 hover:bg-vr-panel/90");
    }
  };
  
  return (
    <div className={cn("vr-panel p-3 max-w-3xl", className)}>
      {keyboardRows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex mb-1">
          {row.map((key, keyIndex) => (
            <Button
              key={`${rowIndex}-${keyIndex}`}
              className={getKeyClass(key)}
              onClick={() => handleKeyPress(key)}
              variant="ghost"
            >
              {key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default VRKeyboard;
