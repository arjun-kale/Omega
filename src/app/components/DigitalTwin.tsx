"use client";

import { useQuery } from "convex/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { api } from "../../../convex/_generated/api";

function getEmissiveColor(temp: number): THREE.Color {
  if (temp > 40) return new THREE.Color("#ef4444");
  if (temp > 35) return new THREE.Color("#eab308");
  return new THREE.Color("#1e293b");
}

function getEmissiveIntensity(temp: number): number {
  if (temp > 40) return 2.0;
  if (temp > 35) return 0.8;
  return 0;
}

function FallbackModel({ temp }: { temp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => getEmissiveColor(temp), [temp]);
  const intensity = useMemo(() => getEmissiveIntensity(temp), [temp]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.3;
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
      <meshStandardMaterial
        color="#374151"
        emissive={color}
        emissiveIntensity={intensity}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function Scene({ temp }: { temp: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />
      <FallbackModel temp={temp} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </>
  );
}

export function DigitalTwin() {
  const latest = useQuery(api.telemetry.getLatest);

  if (latest === undefined) {
    return (
      <div className="h-72 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 h-4 w-28 rounded bg-zinc-800" />
        <div className="h-56 rounded bg-zinc-800" />
      </div>
    );
  }

  const temp = latest?.temp ?? 25;
  const status = temp > 40 ? "CRITICAL" : temp > 35 ? "WARNING" : "NOMINAL";
  const statusColor =
    temp > 40
      ? "text-red-400"
      : temp > 35
        ? "text-yellow-400"
        : "text-green-400";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Digital Twin
        </p>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs font-bold ${statusColor}`}>{status}</span>
          <span className="font-mono text-sm font-bold text-orange-400">
            {temp.toFixed(1)}°C
          </span>
        </div>
      </div>

      <div className="h-56 overflow-hidden rounded-lg bg-zinc-950">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene temp={temp} />
          </Suspense>
        </Canvas>
      </div>

      <div className="mt-3 flex justify-between font-mono text-xs text-zinc-600">
        <span>25°C</span>
        <span className="text-yellow-600">35°C warn</span>
        <span className="text-red-600">40°C critical</span>
      </div>
    </div>
  );
}
