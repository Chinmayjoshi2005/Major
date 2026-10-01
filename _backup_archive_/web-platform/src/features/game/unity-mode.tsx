"use client";

import { useEffect, useRef, useState } from "react";

const buildUrl = "/unity/Build";

interface UnityInstance {
  Quit: () => Promise<void>;
}

export function UnityMode() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unityInstanceRef = useRef<UnityInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const canvas = document.createElement("canvas");
    canvas.id = "unity-canvas";
    canvas.width = 1280;
    canvas.height = 720;
    canvas.tabIndex = -1;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const loadingBar = document.createElement("div");
    loadingBar.id = "unity-loading-bar";
    loadingBar.style.position = "absolute";
    loadingBar.style.top = "50%";
    loadingBar.style.left = "50%";
    loadingBar.style.transform = "translate(-50%, -50%)";
    loadingBar.style.width = "60%";
    loadingBar.style.maxWidth = "600px";
    loadingBar.style.background = "rgba(0,0,0,0.6)";
    loadingBar.style.padding = "1rem";
    loadingBar.style.borderRadius = "0.75rem";
    loadingBar.style.color = "white";
    loadingBar.style.textAlign = "center";

    const status = document.createElement("div");
    status.textContent = "Loading Unity game...";
    status.style.marginBottom = "0.75rem";
    loadingBar.appendChild(status);

    const progressBar = document.createElement("div");
    progressBar.style.width = "100%";
    progressBar.style.height = "10px";
    progressBar.style.background = "rgba(255,255,255,0.2)";
    progressBar.style.borderRadius = "999px";
    progressBar.style.overflow = "hidden";

    const progressFill = document.createElement("div");
    progressFill.style.width = "0%";
    progressFill.style.height = "100%";
    progressFill.style.background = "#4ecdc4";
    progressFill.style.transition = "width 150ms ease";
    progressBar.appendChild(progressFill);
    loadingBar.appendChild(progressBar);

    const warning = document.createElement("div");
    warning.id = "unity-warning";
    warning.style.position = "absolute";
    warning.style.top = "1rem";
    warning.style.left = "1rem";
    warning.style.right = "1rem";
    warning.style.pointerEvents = "none";
    warning.style.zIndex = "10";

    container.appendChild(canvas);
    container.appendChild(loadingBar);
    container.appendChild(warning);

    const script = document.createElement("script");
    script.src = `${buildUrl}/CampusGuideWeb.loader.js`;
    script.async = true;
    script.onload = () => {
      if (typeof window === "undefined") return;

      async function resolveAsset(baseName: string) {
        const uncompressed = `${buildUrl}/${baseName}`;
        try {
          const res = await fetch(uncompressed, { method: "HEAD" });
          if (res.ok) return uncompressed;
        } catch {}
        return `${buildUrl}/${baseName}.gz`;
      }

      (async () => {
        const dataUrl = await resolveAsset("CampusGuideWeb.data");
        const frameworkUrl = await resolveAsset("CampusGuideWeb.framework.js");
        const codeUrl = await resolveAsset("CampusGuideWeb.wasm");

        const config = {
          dataUrl,
          frameworkUrl,
          codeUrl,
          streamingAssetsUrl: "StreamingAssets",
          companyName: "DefaultCompany",
          productName: "Campus Guide",
          productVersion: "0.1.0",
          showBanner: (msg: string, type: string) => {
            const banner = document.createElement("div");
            banner.innerText = msg;
            banner.style.padding = "0.75rem";
            banner.style.color = type === "error" ? "white" : "black";
            banner.style.background = type === "error" ? "red" : "yellow";
            banner.style.marginBottom = "0.5rem";
            warning.appendChild(banner);
            if (type !== "error") {
              window.setTimeout(() => {
                warning.removeChild(banner);
              }, 5000);
            }
          },
        };

        // @ts-expect-error createUnityInstance is injected by the Unity loader.
        createUnityInstance(canvas, config, (progress: number) => {
          progressFill.style.width = `${progress * 100}%`;
        })
          .then((instance: UnityInstance) => {
            unityInstanceRef.current = instance;
            loadingBar.style.display = "none";
          })
          .catch((message: unknown) => {
            const err = String(message ?? "Unity failed to load.");
            setError(err);
            loadingBar.style.display = "none";
          });
      })();
    };
    script.onerror = () => {
      setError("Failed to load the Unity loader script.");
    };

    container.appendChild(script);

    return () => {
      if (unityInstanceRef.current && typeof unityInstanceRef.current.Quit === "function") {
        unityInstanceRef.current.Quit().catch((err: unknown) => {
          console.warn("Failed to quit Unity instance:", err);
        });
      }
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-black">
      {/* Game canvas container: maintains 16:9 aspect ratio responsively */}
      <div className="relative h-full w-full">
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{
            aspectRatio: "16 / 9",
            maxWidth: "100%",
            maxHeight: "100vh",
          }}
        />
      </div>

      {/* Error state overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="max-w-md p-6 text-center">
            <p className="mb-4 text-xl font-bold text-white">
              Game Failed to Load
            </p>
            <p className="mb-4 text-sm text-white/80">{error}</p>
            <p className="text-xs text-white/60">
              Please try refreshing the page or switching back to explore mode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
