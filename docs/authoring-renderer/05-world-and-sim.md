# World and sim helpers

The renderer ships a tiny world/sim layer for demos and headless tests.

- `Sim.createWorldFromMap(map)`: initializes player and actors from map data
- `Sim.advanceTurn(world, commands, rng)`: applies movement/open door, advances actors
- `Sim.isBlocked`, `Sim.isDoorClosed`, `Sim.setDoorOpen`: collision and doors
- Effects: `enqueueHitFlash`, `startDissolve`, `startCameraShake`, `getCameraOffset`

Character mapping helpers (in `world/types`) bridge local actor ids to domain character ids for the adapter:

- `registerCharacterMapping(world, characterId, actorId)`
- `unregisterCharacterMapping(world, characterId)`
- `getActorIdForCharacter(world, characterId)`
- `getCharacterIdForActor(world, actorId)`
