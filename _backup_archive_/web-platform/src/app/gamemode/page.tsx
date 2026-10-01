"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Zap, Target, Trophy, Clock } from "lucide-react";

const UnityMode = dynamic(
  () => import("@/features/game/unity-mode").then((m) => m.UnityMode),
  { ssr: false, loading: () => null }
);

export default function GameModePage() {
  const [score, setScore] = useState(0);
  const [health] = useState(100);
  const [level] = useState(1);
  const [timeLeft] = useState(300);
  const [showObjective, setShowObjective] = useState(true);

  return (
    <main className="campus-shell relative h-[100svh] w-full overflow-hidden bg-black">
      <UnityMode />

      <div className="absolute top-32 left-6 z-10 space-y-4">
        <div className="campus-card">
          <p className="campus-card-label">Score</p>
          <p className="campus-card-value">{score.toLocaleString()}</p>
        </div>

        <div className="campus-card">
          <p className="campus-card-label">Health</p>
          <div className="campus-progress">
            <div
              className="campus-progress-bar bg-red-500"
              style={{ width: `${health}%` }}
            />
          </div>
          <p className="campus-card-value">{health}%</p>
        </div>

        <div className="campus-card">
          <p className="campus-card-label">Level</p>
          <p className="campus-card-value">{level}</p>
        </div>
      </div>

      <div className="absolute top-32 right-6 z-10 space-y-4">
        <div className="campus-card">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <p className="campus-card-label">Time Left</p>
          </div>
          <p className="campus-card-value">
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </div>

        {showObjective && (
          <div className="campus-card">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              <p className="campus-card-label">Objective</p>
            </div>
            <p className="campus-card-copy">
              Explore all departments and collect 3 campus tokens
            </p>
            <button
              onClick={() => setShowObjective(false)}
              className="campus-card-action"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform">
        <div className="h-8 w-8 rounded-full border-2 border-yellow-400" />
        <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-yellow-400" />
      </div>

      <footer className="absolute right-0 bottom-0 left-0 z-10 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="campus-footer-hint">
            <Zap className="h-4 w-4" />
            <span>Use WASD to move • Click to interact</span>
          </div>

          <div className="flex gap-4">
            <button
              className="campus-btn"
              style={{
                background: "#ef4444",
                color: "#fff",
                borderColor: "#b91c1c",
              }}
            >
              Pause
            </button>
            <button
              onClick={() => setScore(score + 100)}
              className="campus-btn campus-btn-primary flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Test +100
            </button>
          </div>
        </div>
      </footer>

      <div className="campus-card absolute bottom-24 left-6 z-10 flex h-32 w-32 items-center justify-center">
        <span className="campus-card-label">Mini map</span>
      </div>
    </main>
  );
}
