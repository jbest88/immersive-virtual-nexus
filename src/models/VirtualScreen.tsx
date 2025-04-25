import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { MovableScreen } from '../components/MovableScreen';

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
  const [currentSize] = useState<{width: number, height: number}>({ width, height });
  const grabOffsetRef = useRef<THREE.Vector3 | null>(null);
  const controllerPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const controllerQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

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

  return (
    <MovableScreen onPositionUpdate={onDrag}>
      <Text
        position={[0, height / 2 + 0.3, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
      
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          color={isDragging ? "#ffffff" : "#f0f0f0"}
          opacity={isDragging ? 0.7 : 0.9}
          transparent={true}
          map={texture || undefined}
        />
      </mesh>
      
      {isDragging && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width + 0.1, height + 0.1]} />
          <meshBasicMaterial 
            color="#4aff68"
            opacity={0.4} 
            transparent={true} 
          />
        </mesh>
      )}
    </MovableScreen>
  );
};

export default VirtualScreen;
