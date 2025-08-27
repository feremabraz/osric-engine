import { useEffect, useRef, useState } from 'react';

export interface ControlsState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  interact: boolean;
  openDoor: boolean;
}

const defaultState: ControlsState = {
  up: false,
  down: false,
  left: false,
  right: false,
  strafeLeft: false,
  strafeRight: false,
  interact: false,
  openDoor: false,
};

/**
 * useInput
 * Tracks keyboard state for movement and interactions.
 * - Outputs: ControlsState
 * - Cleanup: keydown/keyup listeners removed on unmount
 */
export function useInput() {
  const [state, setState] = useState<ControlsState>(defaultState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const k = e.key;
      const next = { ...stateRef.current };
      const isHandled =
        k === 'w' ||
        k === 'ArrowUp' ||
        k === 's' ||
        k === 'ArrowDown' ||
        k === 'a' ||
        k === 'ArrowLeft' ||
        k === 'd' ||
        k === 'ArrowRight' ||
        k === 'q' ||
        k === 'e' ||
        k === 'f' ||
        k === ' ' ||
        k === 'Enter';
      if (isHandled) e.preventDefault();
      let changed = false;
      const set = (key: keyof typeof next, val: boolean) => {
        if (next[key] !== val) {
          next[key] = val;
          changed = true;
        }
      };
      if (k === 'w' || k === 'ArrowUp') set('up', down);
      if (k === 's' || k === 'ArrowDown') set('down', down);
      if (k === 'a' || k === 'ArrowLeft') set('left', down);
      if (k === 'd' || k === 'ArrowRight') set('right', down);
      if (k === 'q') set('strafeLeft', down);
      if (k === 'e') set('strafeRight', down);
      if (k === 'f') set('interact', down);
      if (k === ' ' || k === 'Enter') set('openDoor', down);
      if (changed) setState(next);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  return state;
}
