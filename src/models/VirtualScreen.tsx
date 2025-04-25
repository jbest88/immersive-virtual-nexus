
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

  const handleGrab = (controllerId: string, controllerPosition: THREE.Vector3, controllerQuaternion: THREE.Quaternion) => {
    if (meshRef.current) {
      setGrabbed(true);
      grabOffsetRef.current = meshRef.current.position.clone().sub(controllerPosition);
      controllerPosRef.current.copy(controllerPosition);
      controllerQuatRef.current.copy(controllerQuaternion);
    }
  };

  const handleMove = (controllerId: string, controllerPosition: THREE.Vector3, pushPull: number, delta: number, controllerQuaternion: THREE.Quaternion) => {
    if (!meshRef.current || !grabbed) return;

    // Store latest controller position and quaternion
    controllerPosRef.current.copy(controllerPosition);
    controllerQuatRef.current.copy(controllerQuaternion);

    // Apply continuous movement based on pushPull value if non-zero
    if (Math.abs(pushPull) > 0) {
      // Build the controller's forward vector
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controllerQuaternion);

      // Apply continuous movement with pushPull and delta
      meshRef.current.position.addScaledVector(forward, pushPull * delta);
      
      // Update position state after movement
      const newPosition = meshRef.current.position.clone();
      setCurrentPosition([newPosition.x, newPosition.y, newPosition.z]);
      onDrag?.([newPosition.x, newPosition.y, newPosition.z]);
    }

    // Make screen face the controller
    if (meshRef.current) {
      const direction = new THREE.Vector3().subVectors(controllerPosition, meshRef.current.position);
      direction.y = 0; // Keep screen vertical
      meshRef.current.lookAt(meshRef.current.position.clone().add(direction));
    }
  };

  const handleRelease = () => {
    if (meshRef.current) {
      setGrabbed(false);
      grabOffsetRef.current = null;
    }
  };

  useVRInteraction(handleGrab, handleRelease, handleMove);

  // Use memoized values for material properties
  const materialProps = useMemo(() => ({
    color: hovered ? "#ffffff" : "#f0f0f0",
    opacity: isDragging || grabbed ? 0.7 : (hovered ? 0.95 : 0.9),
    transparent: true,
    map: texture || undefined
  }), [hovered, isDragging, grabbed, texture]);

  return (
    <group position={currentPosition}>
      <Text
        position={[0, currentSize.height / 2 + 0.3, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
      
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[currentSize.width, currentSize.height]} />
        <meshBasicMaterial 
          color={hovered ? "#ffffff" : "#f0f0f0"}
          opacity={isDragging || grabbed ? 0.7 : (hovered ? 0.95 : 0.9)}
          transparent={true}
          map={texture || undefined}
        />
      </mesh>
      
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

      {grabbed && (
        <Text
          position={[0, currentSize.height / 2 + 0.8, 0]}
          fontSize={0.25}
          color="#4aff68"
          anchorX="center"
          anchorY="bottom"
        >
          Use joystick to push/pull screen
        </Text>
      )}
    </group>
  );
};

export default VirtualScreen;
