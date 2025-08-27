# Adapter: engine <-> renderer bridge

The adapter maps local input commands to domain commands and applies engine effects back to the local world.

- `Adapter.toEngineCommands(local: Sim.Command[], playerId, world?)`
- `Adapter.applyEngineEffects(world, effects)`

Notes
- Uses only public barrels from `@osric/osric-engine`.
- Effect handling is typed and exhaustive for the known subset (movement, doors, battle, talk, damage/defeat).
- Movement uses collision slide; doors are toggled in front of the player.
