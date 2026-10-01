"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CampusWorld } from "@/features/explore/campus-world";
import { SceneLoader } from "@/components/3d/scene-loader";
import { useAppStore } from "@/store";

export function CampusCanvas() {
  const mode = useAppStore((s) => s.mode);

  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 12, 24], fov: 50, near: 0.1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CampusWorld mode={mode} />
        </Suspense>
      </Canvas>
      <SceneLoader />

      {/* Hero overlay removed as requested by user */}
    </div>
  );
}
