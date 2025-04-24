
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Text } from '@react-three/drei';
import * as THREE from 'three';

interface VirtualScreenProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  image?: string;
  name?: string;
  isDragging?: boolean;
  onDrag?: (position: [number, number, number]) => void;
}

const VirtualScreen: React.FC<VirtualScreenProps> = ({
  position,
  width = 16,
  height = 9,
  image = '',
  name = 'Screen',
  isDragging = false,
  onDrag
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  // Load texture if provided
  React.useEffect(() => {
    if (image) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(image, (loadedTexture) => {
        setTexture(loadedTexture);
      });
    }
  }, [image]);
  
  useFrame(() => {
    if (meshRef.current && isDragging) {
      // Animation or effect when dragging
      meshRef.current.material.opacity = 0.7;
    } else if (meshRef.current) {
      // Reset effect when not dragging
      meshRef.current.material.opacity = hovered ? 0.95 : 0.9;
    }
  });
  
  return (
    <group position={position}>
      {/* Screen name label */}
      <Text
        position={[0, height / 2 + 0.3, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
      
      {/* Actual screen */}
      <Plane
        ref={meshRef}
        args={[width, height]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshBasicMaterial 
          color={hovered ? "#ffffff" : "#f0f0f0"}
          opacity={0.9} 
          transparent 
          map={texture || undefined}
        />
      </Plane>
      
      {/* Glow effect around the edges when hovered */}
      {hovered && (
        <Plane args={[width + 0.1, height + 0.1]} position={[0, 0, -0.01]}>
          <meshBasicMaterial 
            color="#4a68ff" 
            opacity={0.4} 
            transparent 
          />
        </Plane>
      )}
    </group>
  );
};

export default VirtualScreen;
