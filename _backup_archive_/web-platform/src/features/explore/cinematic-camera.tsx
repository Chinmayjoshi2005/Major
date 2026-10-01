"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useWorldStore } from "@/store";

export function CinematicCamera() {
  const { camera } = useThree();
  const cameraCommand = useWorldStore((s) => s.cameraCommand);
  const clearCameraCommand = useWorldStore((s) => s.clearCameraCommand);
  const animating = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const endLook = useRef(new THREE.Vector3());
  const progress = useRef(0);
  const duration = useRef(2);

  useEffect(() => {
    if (!cameraCommand || cameraCommand.type !== "focus") return;

    startPos.current.copy(camera.position);
    endPos.current.set(
      (cameraCommand.target?.x ?? 0) + 6,
      (cameraCommand.target?.y ?? 0) + 8,
      (cameraCommand.target?.z ?? 0) + 12
    );
    startLook.current.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    endLook.current.set(
      cameraCommand.lookAt?.x ?? 0,
      cameraCommand.lookAt?.y ?? 0,
      cameraCommand.lookAt?.z ?? 0
    );
    progress.current = 0;
    duration.current = cameraCommand.duration ?? 2;
    animating.current = true;
  }, [cameraCommand, camera]);

  useFrame((_, delta) => {
    if (!animating.current) return;

    progress.current += delta / duration.current;
    const t = Math.min(progress.current, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos.current, endPos.current, eased);
    const lookAt = new THREE.Vector3().lerpVectors(
      startLook.current,
      endLook.current,
      eased
    );
    camera.lookAt(lookAt);

    if (t >= 1) {
      animating.current = false;
      clearCameraCommand();
    }
  });

  return null;
}
