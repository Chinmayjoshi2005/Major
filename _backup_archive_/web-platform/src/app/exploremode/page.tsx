"use client";

import dynamic from "next/dynamic";

const CampusCanvas = dynamic(
  () => import("@/components/3d/campus-canvas").then((m) => m.CampusCanvas),
  { ssr: false, loading: () => null }
);

export default function ExplorePage() {
  return (
    <main className="campus-shell relative h-[100svh] w-full overflow-hidden bg-black">
      <CampusCanvas />
    </main>
  );
}
