"use client";

import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import Ecctrl, { type CustomEcctrlRigidBody } from "ecctrl";
import { useRef } from "react";
import type { Vector3Tuple } from "@/types";
import { usePlayerStore } from "@/store";

export function GamePlayer() {
  const setPosition = usePlayerStore((s) => s.setPosition);
  const spawnPoint = usePlayerStore((s) => s.spawnPoint);
  const ref = useRef<CustomEcctrlRigidBody | null>(null);

  useFrame(() => {
    const translation = ref.current?.group?.translation();
    if (!translation) return;
    setPosition([
      translation.x,
      translation.y,
      translation.z,
    ] satisfies Vector3Tuple);
  });

  return (
    <>
      <Ecctrl
        ref={ref}
        position={spawnPoint ?? [0, 1, 8]}
        capsuleHalfHeight={0.35}
        capsuleRadius={0.3}
        maxVelLimit={5}
        jumpVel={4}
        sprintMult={1.6}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </Ecctrl>

      {/* Ground plane fallback until trimesh colliders are generated */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[100, 0.1, 100]} />
          <meshStandardMaterial visible={false} />
        </mesh>
      </RigidBody>
    </>
  );
}
