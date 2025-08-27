/** @internal Configuration types and defaults for adapter helpers. */

/** Step sizes for movement and turn increments (radians). */
export type MotionConfig = {
  step: number;
  turn: number;
};

/** Field of view, max target distance, and LOS sampling steps. */
export type TargetingConfig = {
  fov: number;
  maxDist: number;
  /** Number of interpolation steps for LOS. If 0, skip LOS check. */
  losSteps: number;
};

/** Camera shake intensity and duration. */
export type ShakeConfig = {
  amplitude: number;
  duration: number;
};

export const DEFAULT_MOTION: MotionConfig = {
  step: 0.5,
  turn: Math.PI / 12,
};

export const DEFAULT_TARGETING_ATTACK: TargetingConfig = {
  fov: Math.PI / 6,
  maxDist: 4.0,
  losSteps: 16,
};

export const DEFAULT_TARGETING_INTERACT: TargetingConfig = {
  fov: Math.PI / 4,
  maxDist: 2.0,
  // Interact does not require LOS by default
  losSteps: 0,
};

export const DEFAULT_SHAKE_HIT: ShakeConfig = {
  amplitude: 1,
  duration: 3,
};

export const DEFAULT_SHAKE_TALK: ShakeConfig = {
  amplitude: 1,
  duration: 2,
};
