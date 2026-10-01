"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ModeSwitcher } from "@/features/explore/mode-switcher";
import { SearchPanel } from "@/features/search/search-panel";
import { UnityMode } from "@/features/game/unity-mode";
import { useAppStore, useNavigationStore } from "@/store";

const CampusCanvas = dynamic(
  () => import("@/components/3d/campus-canvas").then((m) => m.CampusCanvas),
  { ssr: false, loading: () => null }
);

export function CampusExperience() {
  const searchParams = useSearchParams();
  const queryMode = searchParams?.get("mode");
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const route = useNavigationStore((s) => s.activeRoute);
  const currentIndex = useNavigationStore((s) => s.currentWaypointIndex);

  useEffect(() => {
    if (queryMode === "game") {
      setMode("game");
    }
  }, [queryMode, setMode]);

  const isGameMode = mode === "game";

  return (
    <main className="campus-shell relative h-[100svh] w-full overflow-hidden bg-black">
      <a className="campus-skip-link" href="#campus-search">
        Skip to campus search
      </a>

      {isGameMode ? <UnityMode /> : <CampusCanvas />}

      {!isGameMode && (
        <>
          <div className="campus-atmosphere" aria-hidden="true" />

          <aside
            id="campus-search"
            className="campus-search-dock"
            aria-label="Find a campus destination"
          >
            <div className="pointer-events-auto w-full">
              <SearchPanel />
            </div>
          </aside>

          {route?.found && route.instructions.length > 0 && (
            <footer
              className="campus-route-status"
              role="status"
              aria-live="polite"
            >
              <div className="pointer-events-auto mx-auto max-w-lg">
                <p className="campus-route-label">
                  Navigation · Step{" "}
                  {`${currentIndex + 1}/${route.instructions.length}`}
                </p>
                <p className="campus-route-instruction">
                  {route.instructions[currentIndex] ?? route.instructions[0]}
                </p>
              </div>
            </footer>
          )}
        </>
      )}

      {isGameMode && (
        <div className="campus-game-switcher pointer-events-auto absolute top-5 right-5 z-20">
          <ModeSwitcher />
        </div>
      )}
    </main>
  );
}
