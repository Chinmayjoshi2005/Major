"use client";

import { ContactShadows } from "@react-three/drei";
import type { InteractionMode } from "@/types";

export function LightingRig({ mode }: { mode: InteractionMode }) {
  const ambientIntensity = mode === "explore" ? 0.5 : 0.6;

  return (
    <>
      <color attach="background" args={["#5a9fb5"]} />
      <fog attach="fog" args={["#5a9fb5", 50, 150]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={mode === "explore" ? 1.2 : 1.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={80}
        blur={2}
        far={20}
      />
    </>
  );
}
