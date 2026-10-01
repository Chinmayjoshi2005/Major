"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CAMPUS_MODEL_URL } from "@/lib/campus/room-mesh-map";
import { useWorldStore } from "@/store";

type CampusModelProps = {
  highlightMeshes?: string[];
};

export function CampusModel({ highlightMeshes = [] }: CampusModelProps) {
  const { scene } = useGLTF(CAMPUS_MODEL_URL);
  const setCampusLoaded = useWorldStore((s) => s.setCampusLoaded);
  const dispatchCamera = useWorldStore((s) => s.dispatchCamera);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    setCampusLoaded();
  }, [setCampusLoaded]);

  useEffect(() => {
    // compute bounding box and request camera focus to fit the model
    try {
      const box = new THREE.Box3().setFromObject(
        clonedScene as unknown as THREE.Object3D
      );
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());

        dispatchCamera({
          type: "focus",
          target: { x: center.x, y: center.y, z: center.z },
          lookAt: { x: center.x, y: center.y, z: center.z },
          duration: 1.8,
        });
      }
    } catch {}
  }, [clonedScene, dispatchCamera]);

  useEffect(() => {
    const highlightSet = new Set(highlightMeshes);
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;
      const isHighlighted = highlightSet.has(mesh.name);

      if (isHighlighted) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#ffe600",
          emissive: "#ffe600",
          emissiveIntensity: 0.4,
          metalness: 0.1,
          roughness: 0.6,
        });
      }
    });
  }, [clonedScene, highlightMeshes]);

  return <primitive object={clonedScene} />;
}

useGLTF.preload(CAMPUS_MODEL_URL);
