import { create } from "zustand";
import type { InteractionMode } from "@/types";

type AppPanel = "search" | "info" | "navigation" | null;

interface AppState {
  mode: InteractionMode;
  previousMode: InteractionMode | null;
  isSceneReady: boolean;
  isLoading: boolean;
  activePanel: AppPanel;

  setMode: (mode: InteractionMode) => void;
  setSceneReady: (ready: boolean) => void;
  setLoading: (loading: boolean) => void;
  togglePanel: (panel: AppPanel) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: "explore",
  previousMode: null,
  isSceneReady: false,
  isLoading: true,
  activePanel: null,

  setMode: (mode) =>
    set((state) => ({
      mode,
      previousMode: state.mode,
      activePanel: mode === "game" ? "navigation" : state.activePanel,
    })),

  setSceneReady: (ready) => set({ isSceneReady: ready, isLoading: !ready }),
  setLoading: (loading) => set({ isLoading: loading }),

  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),
}));
