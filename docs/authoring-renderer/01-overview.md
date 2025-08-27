# Authoring: Underworld Renderer

This section documents the minimal, deterministic software renderer used for grid‑based dungeons. It complements the engine and domain authoring guides.

- Audience: developers integrating a ray‑caster‑style renderer or building an FPS dungeon crawler UI.
- Scope: façade API, low‑level primitives, assets (palette/textures/sprites), world sim helpers, domain adapter, and browser integration.

## Packages in play

- `@osric/renderer-underworld` — the renderer package (this guide)
- `@osric/engine` — deterministic core
- `@osric/osric-engine` — OSRIC domain (optional, used by the adapter)

## Main entry points

- Facade: `createRenderer({ camera, grids, materials, lightLUT, fogDensity })`
- Primitives: `createFramebuffer`, `renderFloorCeiling`, `renderWalls`, `renderBillboards`, `blitNearestUpscaled`
- Assets: `Palette` (LUTs, mood), `Textures` (procedural), `Sprites` (atlas provider)
- World: `Sim` (map/world helpers)
- Adapter: `Adapter` (bridge to domain commands/effects)
