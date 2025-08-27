# App.tsx Compartmentalization Plan

Goal: Extract React-bound effects into hooks, move orchestration into framework-agnostic systems, and make rendering/presentation pure. Keep behavior identical (turn-based, one-step-per-keypress; no CSS sizing).

Legend
- [ ] Not started
- [x] Done

Order of work (no priorities implied)

1) Scaffolding and shared types
- [x] Confirm `viewer-underworld/src/types/viewer.ts` has or add: `AppConfig`, `ControlsState`, `LoopMetrics`, `FrameContext` (readonly where possible), and export them.
- [x] Add minimal TSDoc to those types (inputs/outputs where relevant).

2) Hooks (React-bound; side effects and subscriptions only)
- [x] usePlayerCharacter(engineRef)
  - File: `viewer-underworld/src/hooks/usePlayerCharacter.ts`
  - Behavior: on mount, ensure the character with id "player" exists via DomainEngine; no re-runs.
  - TSDoc: inputs, idempotency guarantees.
- [x] useNpcCharacterRegistration(engineRef, worldRef, setWorld)
  - File: `viewer-underworld/src/hooks/useNpcCharacterRegistration.ts`
  - Behavior: watch `worldRef.current.actors` and register NPC characters in the DomainEngine as they appear; update `characterMap` via Sim helpers.
  - TSDoc: when it runs, constraints (no duplicates), cleanup.
- [x] useOverlayToggleKey(defaultVisible = false, key = 'o')
  - File: `viewer-underworld/src/hooks/useOverlayToggleKey.ts`
  - Behavior: window keydown listener; ignore repeats; preventDefault; returns `[show, toggle]`.
  - TSDoc: key handling, cleanup.
- [x] useRendererSystem(assets, worldRef, size)
  - File: `viewer-underworld/src/hooks/useRendererSystem.ts`
  - Behavior: create and memoize `createRendererSystem` once assets and size are ready; supply stable grid adapters that read from `worldRef.current`.
  - Returns: `rendererRef`.
  - TSDoc: what re-initializes the system; guarantees about grids and door checks.

3) Systems (framework-agnostic; pure; reusable in Node tests)
- [x] AiSystem: engage + hostile step
  - File: `viewer-underworld/src/systems/aiSystem.ts`
  - Interface: `maybeEngageAndStep(world, engine)` returns `Effect[]` or `{ world, effects }`.
  - Behavior: engagement (start battle, initiative) and a single hostile action (move or attack) mirroring current logic.
  - Reuse: `@osric/renderer-underworld/adapter/targeting` and helpers instead of re-implementing LOS.
  - TSDoc: high-level contract; no React imports.
- [ ] SimSystem usage alignment
  - Ensure `createSimSystem` is used for player turn steps: `step(localCommands)` returns `{ world, effects }` and advances the sim turn.
  - Add minimal TSDoc on SimSystem public methods if missing.

4) Presenters (pure functions; no React state)
- [x] renderFrame(renderer, world, draw)
  - File: `viewer-underworld/src/presenters/frame.ts`
  - Inputs: `renderer.facade`, `world`, `draw(texture)`.
  - Behavior: set camera from world player, build sprites array, call `render({ sprites, tick })`, then `draw`.
  - TSDoc: inputs/outputs; side-effect free (except passed-in `draw`).
- [x] createGrids(worldRef)
  - File: `viewer-underworld/src/presenters/grids.ts`
  - Outputs: `{ walls, floorCeiling }` closures referencing `worldRef.current`.
  - Usage: consumed by `useRendererSystem` to avoid duplicating grid definitions.
  - TSDoc: invariants and read-only access.
- [x] mapControlsToLocalCommands(prev, curr)
  - File: `viewer-underworld/src/presenters/controls.ts`
  - Behavior: returns `Adapter.LocalCommand[]` based on keydown transitions (one step per press).
  - TSDoc: inputs/outputs; repeat handling.

5) Wire App.tsx to the extracted modules
- [x] Replace inline player creation effect with `usePlayerCharacter(engineRef)`.
- [x] Replace NPC registration effect with `useNpcCharacterRegistration(engineRef, worldRef, setWorld)`.
- [x] Replace overlay key handler with `useOverlayToggleKey('o')` and state from the hook.
- [x] Replace renderer init effect with `useRendererSystem(assets, worldRef, { width: 320, height: 200 })`.
- [x] Replace `drawFrame` with `renderFrame(rendererRef.current.facade, worldRef.current, canvasViewRef.current.draw)` in the RAF tick.
- [x] Replace `tryEngageAndAi()` with `aiSystem.maybeEngageAndStep(worldRef.current, engineRef.current)` and apply effects to world.
- [x] Use `mapControlsToLocalCommands(prevControls, controls)` to build local commands for the Sim step.
- [x] Keep the one-step-per-keypress logic and explicit sequence: input → sim step → AI step → render.

6) Cleanup and documentation
- [x] Remove inlined `drawFrame` and `tryEngageAndAi` from `App.tsx`.
- [x] Trim `App.tsx` to a thin orchestrator (~100–150 LOC), with the frame algorithm comment kept in sync.
- [x] Add/verify TSDoc on all newly created modules (hooks, systems, presenters).
- [x] Lint, typecheck, and build all packages.
- [ ] Manual smoke run: verify turn-based input, canvas sizing (non-CSS), overlay toggle, and render parity.

Acceptance (for this compartmentalization)
- [ ] No behavior change: controls (one step per keypress), AI cadence, and visuals match current viewer.
- [x] App.tsx contains only wiring/orchestration; all heavy logic lives in hooks/systems/presenters.
- [x] New modules have minimal, clear contracts with TSDoc.
- [x] Typecheck/lint/build pass; unit tests for pure modules pass.
