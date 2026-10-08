# Campus Guide 3D

Production-ready web-based digital twin of the college campus. Students, visitors, faculty, and administrators can search locations, explore the campus in 3D, and play the interactive game mode — all inside the browser.

## Project Structure

```
CampusGuide3D/
├── blender/              # Source of truth — campus 3D models originate here
├── UnityWebGL/           # WebGL build with Blender campus model (Game & Explore modes)
├── data/                 # Standard JSON datasets (rooms, departments, faculty, navigation)
├── database/scripts/     # Data import and utility scripts
├── docs/                 # Architecture & system design documentation
└── web-platform/         # Next.js 15 production web application
```

## 3D Engine & Asset Pipeline

```
Blender Campus Model → Unity (Physics, Colliders, Player Controller, Cameras) → Unity WebGL → Next.js Web Platform
```

- **Explore Mode:** Cinematic 3D camera exploration of the college campus.
- **Game Mode:** Third-person playable character navigation with physics, collision detection, and jumping.
- **Campus Directory:** Live searchable database of rooms, departments, and faculty with entrance-to-room pathfinding.

## Quick Start

```bash
cd web-platform
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide Icons · Unity WebGL (Brotli Wasm)
