import { create } from "zustand";
import type { NavPoint, NavigationRoute, Vector3Tuple } from "@/types";

interface NavigationState {
  origin: NavPoint | null;
  destination: NavPoint | null;
  activeRoute: NavigationRoute | null;
  isNavigating: boolean;
  currentWaypointIndex: number;

  setOrigin: (point: NavPoint) => void;
  setDestination: (point: NavPoint) => void;
  setRoute: (route: NavigationRoute | null) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  advanceWaypoint: () => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  origin: null,
  destination: null,
  activeRoute: null,
  isNavigating: false,
  currentWaypointIndex: 0,

  setOrigin: (point) => set({ origin: point }),
  setDestination: (point) => set({ destination: point }),
  setRoute: (route) => set({ activeRoute: route, currentWaypointIndex: 0 }),
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false, currentWaypointIndex: 0 }),
  advanceWaypoint: () =>
    set((state) => ({
      currentWaypointIndex: state.currentWaypointIndex + 1,
    })),
  reset: () =>
    set({
      origin: null,
      destination: null,
      activeRoute: null,
      isNavigating: false,
      currentWaypointIndex: 0,
    }),
}));

interface PlayerState {
  position: Vector3Tuple;
  rotation: number;
  isGrounded: boolean;
  isSprinting: boolean;
  spawnPoint: Vector3Tuple | null;

  setPosition: (pos: Vector3Tuple) => void;
  setRotation: (rotation: number) => void;
  setGrounded: (grounded: boolean) => void;
  setSprinting: (sprinting: boolean) => void;
  setSpawnPoint: (pos: Vector3Tuple) => void;
  reset: () => void;
}

const DEFAULT_SPAWN: Vector3Tuple = [0, 1, 8];

export const usePlayerStore = create<PlayerState>((set) => ({
  position: DEFAULT_SPAWN,
  rotation: 0,
  isGrounded: true,
  isSprinting: false,
  spawnPoint: DEFAULT_SPAWN,

  setPosition: (pos) => set({ position: pos }),
  setRotation: (rotation) => set({ rotation }),
  setGrounded: (grounded) => set({ isGrounded: grounded }),
  setSprinting: (sprinting) => set({ isSprinting: sprinting }),
  setSpawnPoint: (pos) => set({ spawnPoint: pos, position: pos }),
  reset: () =>
    set({
      position: DEFAULT_SPAWN,
      rotation: 0,
      isGrounded: true,
      isSprinting: false,
      spawnPoint: DEFAULT_SPAWN,
    }),
}));
