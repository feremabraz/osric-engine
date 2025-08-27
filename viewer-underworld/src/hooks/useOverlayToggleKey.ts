import { useCallback, useEffect, useState } from 'react';

/**
 * Window keydown listener that toggles a boolean when the given key is pressed.
 * - Ignores repeats
 * - Prevents default
 * Returns `[visible, toggle]`.
 */
export function useOverlayToggleKey(defaultVisible = false, key = 'o') {
  const [visible, setVisible] = useState<boolean>(defaultVisible);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === key || e.key === key.toUpperCase()) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, toggle]);
  return [visible, toggle] as const;
}
