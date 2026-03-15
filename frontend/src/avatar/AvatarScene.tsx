"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { VisemeTiming } from './visemeController';

function AvatarModel({ visemeQueue }: { visemeQueue: VisemeTiming[] }) {
  // Drop your ARKit-ready GLB in the public folder (`public/avatar.glb`)
  // and uncomment the line below when you have it.
  // import { useGLTF } from '@react-three/drei';
  // const { nodes } = useGLTF('/avatar.glb', true, true);
  
  const meshRef = useRef<any>(null);
  const currentViseme = useRef<string>("default");

  useFrame((state, delta) => {
    if (visemeQueue.length > 0) {
      currentViseme.current = visemeQueue[0].viseme;
      visemeQueue[0].durationMs -= delta * 1000;
      if (visemeQueue[0].durationMs <= 0) visemeQueue.shift();
    } else {
      currentViseme.current = "default";
    }

    // Animate the cube to show viseme activity
    if (meshRef.current) {
      const isActive = currentViseme.current !== "default";
      const targetScale = isActive ? 1.3 : 1.0;
      meshRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale },
        0.1
      );
      meshRef.current.rotation.y += delta * 0.5;
      // Change color based on viseme
      if (meshRef.current.material) {
        meshRef.current.material.color.set(isActive ? "#00e5ff" : "#ff69b4");
      }
    }
  });

  return (
    <group dispose={null} position={[0, 0, 0]}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
    </group>
  );
}

export default function AvatarScene() {
  const [visemes, setVisemes] = useState<VisemeTiming[]>([]);
  
  useEffect(() => {
    const handleMockEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setVisemes(v => [...v, ...customEvent.detail]);
    };
    window.addEventListener("fake-tts-event", handleMockEvent);
    return () => window.removeEventListener("fake-tts-event", handleMockEvent);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      {/* Use simple lights instead of Environment preset (avoids network HDR fetch) */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color="#ff69b4" />
      <AvatarModel visemeQueue={visemes} />
    </Canvas>
  );
}
