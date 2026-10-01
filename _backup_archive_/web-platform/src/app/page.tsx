import Link from "next/link";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard } from "@/components/neo-brutal/neo-card";
import { MapPin, Search, Users, Building2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="page-content min-h-screen bg-gradient-to-b from-sky-100 to-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 font-mono text-sm font-bold tracking-widest text-gray-600 uppercase">
              Digital Campus Twin
            </p>
            <h2 className="text-5xl leading-tight font-black tracking-tight uppercase lg:text-6xl">
              Find Anyone.
              <br />
              Go Anywhere.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-gray-700">
              Search faculty, rooms, and departments. Explore the campus
              cinematically or navigate interactively in 3D — all in your
              browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/campus">
                <NeoButton size="lg">Enter Campus</NeoButton>
              </Link>
              <Link href="/campus?mode=game">
                <NeoButton size="lg" variant="secondary">
                  Start Navigation
                </NeoButton>
              </Link>
            </div>
          </div>

          <NeoCard className="bg-white">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Search,
                  label: "Smart Search",
                  desc: "Faculty & rooms",
                },
                { icon: MapPin, label: "3D Explore", desc: "Cinematic tours" },
                {
                  icon: Users,
                  label: "Live Status",
                  desc: "Faculty availability",
                },
                { icon: Building2, label: "Indoor Nav", desc: "Pathfinding" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="neo-border p-4">
                  <Icon className="mb-2 h-8 w-8" />
                  <p className="font-bold uppercase">{label}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </NeoCard>
        </div>
      </section>
    </main>
  );
}
