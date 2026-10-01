# Campus Guide 3D

Production-ready web-based digital twin of the college campus. Students, visitors, faculty, and administrators can search locations, explore the campus cinematically, and navigate interactively in 3D — all inside the browser.

## Monorepo Structure

```
CampusGuide3D/
├── blender/              # Source of truth — campus models originate here
├── unity-prototype/      # Reference only — validated gameplay concepts
├── docs/                 # Architecture & system design
├── data/                 # Seed JSON datasets
├── database/scripts/     # MongoDB import/export utilities
└── web-platform/         # Next.js 15 production application
```

## Asset Pipeline

```
Blender → Optimized GLB (Draco) → React Three Fiber → Vercel CDN
```

**Single authoritative campus model:** `web-platform/public/models/campus.glb`

## Quick Start

```bash
cd web-platform
npm install
cp .env.example .env.local   # Configure MongoDB, NextAuth, Cloudinary
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Modes

| Mode | Purpose |
|------|---------|
| **Explore** | Cinematic camera, hotspots, premium presentation |
| **Game** | Third-person WASD navigation with physics |

Both modes share the **same 3D world** — no scene duplication.

## Tech Stack

Next.js 15 · TypeScript · Tailwind · shadcn/ui · Framer Motion · React Three Fiber · Rapier · ecctrl · Zustand · MongoDB Atlas · NextAuth · Zod · Cloudinary · Vercel

## Documentation

> **Read the master blueprint before writing feature code:**  
> [`docs/IMPLEMENTATION-BLUEPRINT.md`](./docs/IMPLEMENTATION-BLUEPRINT.md)

See [`docs/`](./docs/) for complete architecture:

- [**Implementation Blueprint**](./docs/IMPLEMENTATION-BLUEPRINT.md) ← start here
- [Data Analysis (Faculty data.json)](./docs/DATA-ANALYSIS.md)
- [Data Flow](./docs/DATA-FLOW.md)
- [Folder Structure](./docs/FOLDER-STRUCTURE.md)
- [System Architecture](./docs/architecture.md)
- [Database Schema](./docs/database-schema.md)
- [State Management](./docs/state-management.md)
- [Navigation System](./docs/navigation-system.md)
- [Security](./docs/security.md)
- [Rendering](./docs/rendering.md)
- [API Design](./docs/api.md)
- [Deployment](./docs/deployment.md)

## Legacy Reference

- **Smartracker** (Django prototype): `~/Desktop/Smartracker-main`
- **Unity prototype**: `~/Documents/Unity project/Campus Guide`

These are preserved as reference — not deployment targets.
