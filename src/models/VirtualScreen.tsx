
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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
  
  // Use memoized values for material properties
  const materialProps = useMemo(() => ({
    color: hovered ? "#ffffff" : "#f0f0f0",
    opacity: isDragging ? 0.7 : (hovered ? 0.95 : 0.9),
    transparent: true,
    map: texture || undefined
  }), [hovered, isDragging, texture]);
  
  // Safe material updates
  useFrame(() => {
    if (!meshRef.current) return;
  });
  
  // Handle pointer events directly
  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);
  
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
      <mesh 
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial {...materialProps} />
      </mesh>
      
      {/* Glow effect around the edges when hovered */}
      {hovered && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width + 0.1, height + 0.1]} />
          <meshBasicMaterial 
            color="#4a68ff" 
            opacity={0.4} 
            transparent={true} 
          />
        </mesh>
      )}
    </group>
  );
};

export default VirtualScreen;
