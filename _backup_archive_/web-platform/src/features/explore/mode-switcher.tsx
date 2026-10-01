"use client";

import { NeoButton } from "@/components/neo-brutal/neo-button";
import { useAppStore } from "@/store";
import { Gamepad2, Sparkles } from "lucide-react";

export function ModeSwitcher() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);

  return (
    <div className="flex gap-2">
      <NeoButton
        size="sm"
        variant={mode === "explore" ? "primary" : "secondary"}
        onClick={() => setMode("explore")}
        aria-pressed={mode === "explore"}
        aria-label="Switch to explore mode"
      >
        <Sparkles className="mr-1 inline h-4 w-4" />
        Explore
      </NeoButton>
      <NeoButton
        size="sm"
        variant={mode === "game" ? "primary" : "secondary"}
        onClick={() => setMode("game")}
        aria-pressed={mode === "game"}
        aria-label="Switch to game mode"
      >
        <Gamepad2 className="mr-1 inline h-4 w-4" />
        Game
      </NeoButton>
    </div>
  );
}
