"use client";

import type { InteractionMode } from "@/types";
import { CampusModel } from "@/components/3d/campus-model";
import { LightingRig } from "@/components/3d/lighting-rig";
import { CinematicCamera } from "@/features/explore/cinematic-camera";
import { GamePlayer } from "@/features/game/game-player";
import { RouteVisualizer } from "@/features/navigation/route-visualizer";
import { useWorldStore } from "@/store";
import { Physics, RigidBody } from "@react-three/rapier";

type CampusWorldProps = {
  mode: InteractionMode;
};

export function CampusWorld({ mode }: CampusWorldProps) {
  const highlightedMeshNames = useWorldStore((s) => s.highlightedMeshNames);

  const model = <CampusModel highlightMeshes={highlightedMeshNames} />;

  if (mode === "game") {
    return (
      <Physics timeStep="vary" gravity={[0, -9.81, 0]}>
        <LightingRig mode={mode} />
        <RigidBody type="fixed" colliders="trimesh">
          {model}
        </RigidBody>
        <GamePlayer />
        <RouteVisualizer />
      </Physics>
    );
  }

  return (
    <>
      <LightingRig mode={mode} />
      {model}
      <CinematicCamera />
    </>
  );
}
