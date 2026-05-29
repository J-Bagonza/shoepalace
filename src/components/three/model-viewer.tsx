"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
  url: string;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-px w-24 bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] uppercase tracking-widest
          text-neutral-400">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  // Auto-rotate — slows when user interacts (OrbitControls handles pause)
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.3;
  });

  // Center and normalize model scale
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 2 / maxDim : 1;

  const center = box.getCenter(new THREE.Vector3());

  return (
    <group ref={ref}>
      <primitive
        object={scene}
        scale={scale}
        position={[
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        ]}
      />
    </group>
  );
}

interface ModelViewerProps {
  url: string;
}

export function ModelViewer({ url }: ModelViewerProps) {
  return (
    <div className="relative w-full aspect-square bg-[#F5F0E8]">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 2, -5]} intensity={0.4} />

        {/* Environment */}
        <Environment preset="city" />

        {/* Model */}
        <Suspense fallback={<Loader />}>
          <Model url={url} />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.3}
            scale={6}
            blur={2}
            far={2}
          />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={7}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={false}
        />
      </Canvas>

      {/* Interaction hint */}
      <div className="absolute bottom-3 left-3 text-[10px] uppercase
        tracking-widest text-neutral-400 pointer-events-none select-none">
        Drag to rotate
      </div>
    </div>
  );
}