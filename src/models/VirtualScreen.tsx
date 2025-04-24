
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useVRInteraction } from '../hooks/useVRInteraction';

interface VirtualScreenProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  image?: string;
  videoStream?: MediaStream | null;
  name?: string;
  isDragging?: boolean;
  onDrag?: (position: [number, number, number]) => void;
}

const VirtualScreen: React.FC<VirtualScreenProps> = ({
  position,
  width = 16,
  height = 9,
  image = '',
  videoStream = null,
  name = 'Screen',
  isDragging = false,
  onDrag
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);
  const [currentSize, setCurrentSize] = useState<{width: number, height: number}>({ width, height });
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  
  // Create video element for the stream if provided
  useEffect(() => {
    if (videoStream) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = videoStream;
      video.play().catch(e => console.error("Error playing video:", e));
      setVideoElement(video);
      
      // Create a video texture
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;
      videoTextureRef.current = videoTexture;
      setTexture(videoTexture);
      
      return () => {
        video.srcObject = null;
        videoTextureRef.current?.dispose();
      };
    } else if (image) {
      // Load image texture if provided and no video
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(image, (loadedTexture) => {
        setTexture(loadedTexture);
      });
    } else {
      // Reset texture if neither video nor image
      setTexture(null);
    }
  }, [videoStream, image]);
  
  // Update video texture each frame
  useFrame(() => {
    if (videoTextureRef.current && videoElement) {
      videoTextureRef.current.needsUpdate = true;
    }
  });

  const handleGrab = (controllerId: string, controllerPosition: THREE.Vector3) => {
    if (meshRef.current) {
      const screenPosition = meshRef.current.position.clone();
      const offset = new THREE.Vector3().subVectors(screenPosition, controllerPosition);
      meshRef.current.userData.offset = offset;
      setGrabbed(true);
    }
  };

  const handleMove = (controllerId: string, controllerPosition: THREE.Vector3) => {
    if (meshRef.current && meshRef.current.userData.offset && grabbed) {
      const newPosition = new THREE.Vector3()
        .addVectors(controllerPosition, meshRef.current.userData.offset);
      
      meshRef.current.position.copy(newPosition);
      setCurrentPosition([newPosition.x, newPosition.y, newPosition.z]);
      onDrag?.([newPosition.x, newPosition.y, newPosition.z]);
    }
  };

  const handleRelease = (controllerId: string) => {
    if (meshRef.current) {
      meshRef.current.userData.offset = null;
      setGrabbed(false);
    }
  };

  const handleJoystickMove = (controllerId: string, joystickValue: number) => {
    // Use joystick for resizing
    // Positive values (pushing forward) make the screen bigger
    // Negative values (pulling back) make the screen smaller
    const resizeFactor = 1 + (joystickValue * 0.03); // Scale the effect
    
    setCurrentSize(prevSize => {
      const newWidth = Math.max(4, Math.min(30, prevSize.width * resizeFactor));
      const newHeight = Math.max(3, Math.min(20, prevSize.height * resizeFactor));
      
      return {
        width: newWidth,
        height: newHeight
      };
    });
  };

  useVRInteraction(handleGrab, handleRelease, handleMove, handleJoystickMove);

  // Use memoized values for material properties
  const materialProps = useMemo(() => ({
    color: hovered ? "#ffffff" : "#f0f0f0",
    opacity: isDragging || grabbed ? 0.7 : (hovered ? 0.95 : 0.9),
    transparent: true,
    map: texture || undefined
  }), [hovered, isDragging, grabbed, texture]);

  return (
    <group position={currentPosition}>
      {/* Screen name label */}
      <Text
        position={[0, currentSize.height / 2 + 0.3, 0]}
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
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[currentSize.width, currentSize.height]} />
        <meshBasicMaterial {...materialProps} />
      </mesh>
      
      {/* Glow effect around the edges when hovered, grabbed or being moved */}
      {(hovered || isDragging || grabbed) && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[currentSize.width + 0.1, currentSize.height + 0.1]} />
          <meshBasicMaterial 
            color={grabbed ? "#4aff68" : (isDragging ? "#4aff68" : "#4a68ff")}
            opacity={0.4} 
            transparent={true} 
          />
        </mesh>
      )}

      {/* Resize indicators when grabbed */}
      {grabbed && (
        <>
          <Text
            position={[0, currentSize.height / 2 + 0.8, 0]}
            fontSize={0.25}
            color="#4aff68"
            anchorX="center"
            anchorY="bottom"
          >
            Push joystick forward/back to resize
          </Text>
        </>
      )}
    </group>
  );
};

export default VirtualScreen;
