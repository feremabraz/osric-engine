import type { Adapter } from '@osric/renderer-underworld';

export type ControlsLike = Record<
  'up' | 'down' | 'left' | 'right' | 'strafeLeft' | 'strafeRight' | 'interact' | 'openDoor',
  boolean
>;

/** Map edge-triggered input transitions into local commands. */
export function mapControlsToLocalCommands(
  prev: ControlsLike,
  curr: ControlsLike
): Adapter.LocalCommand[] {
  const justPressed = (k: keyof ControlsLike) => curr[k] && !prev[k];
  const local: Adapter.LocalCommand[] = [];
  if (justPressed('left')) local.push({ type: 'TurnLeft' });
  if (justPressed('right')) local.push({ type: 'TurnRight' });
  if (justPressed('up')) local.push({ type: 'MoveForward' });
  if (justPressed('down')) local.push({ type: 'MoveBackward' });
  if (justPressed('strafeLeft')) local.push({ type: 'StrafeLeft' });
  if (justPressed('strafeRight')) local.push({ type: 'StrafeRight' });
  if (justPressed('openDoor')) local.push({ type: 'OpenDoor' });
  if (justPressed('interact')) local.push({ type: 'Interact' });
  return local;
}
