import { create } from "zustand";
import type { CameraCommand, FocusTarget, Hotspot } from "@/types";

interface WorldState {
  campusModelLoaded: boolean;
  highlightedMeshNames: string[];
  focusedTarget: FocusTarget | null;
  cameraCommand: CameraCommand | null;
  hotspots: Hotspot[];

  setCampusLoaded: () => void;
  highlightMeshes: (names: string[]) => void;
  clearHighlights: () => void;
  focusTarget: (target: FocusTarget) => void;
  clearFocus: () => void;
  dispatchCamera: (cmd: CameraCommand) => void;
  clearCameraCommand: () => void;
  setHotspots: (hotspots: Hotspot[]) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  campusModelLoaded: false,
  highlightedMeshNames: [],
  focusedTarget: null,
  cameraCommand: null,
  hotspots: [],

  setCampusLoaded: () => set({ campusModelLoaded: true }),
  highlightMeshes: (names) => set({ highlightedMeshNames: names }),
  clearHighlights: () => set({ highlightedMeshNames: [] }),
  focusTarget: (target) =>
    set({
      focusedTarget: target,
      highlightedMeshNames: target.meshNames ?? [],
      cameraCommand: {
        type: "focus",
        target: target.position,
        lookAt: target.lookAt ?? target.position,
        duration: 2,
      },
    }),
  clearFocus: () => set({ focusedTarget: null, highlightedMeshNames: [] }),
  dispatchCamera: (cmd) => set({ cameraCommand: cmd }),
  clearCameraCommand: () => set({ cameraCommand: null }),
  setHotspots: (hotspots) => set({ hotspots }),
}));
