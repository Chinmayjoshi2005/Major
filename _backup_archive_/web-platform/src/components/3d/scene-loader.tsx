"use client";

import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { useAppStore } from "@/store";

export function SceneLoader() {
  const { progress, active } = useProgress();
  const setSceneReady = useAppStore((s) => s.setSceneReady);

  useEffect(() => {
    if (!active && progress === 100) {
      setSceneReady(true);
    }
  }, [active, progress, setSceneReady]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40">
      <div className="neo-card bg-neo-yellow text-center">
        <p className="text-lg font-black uppercase">Loading Campus</p>
        <p className="mt-2 font-mono text-2xl font-bold">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
