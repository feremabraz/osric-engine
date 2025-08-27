/** @packageDocumentation Viewer-level types for App orchestration scaffolding. */

/** Minimal configuration for the viewer app. */
export interface AppConfig {
  readonly internalWidth: number;
  readonly internalHeight: number;
}

/** Snapshot of input state for a frame. */
export interface ControlsState {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
  readonly strafeLeft: boolean;
  readonly strafeRight: boolean;
  readonly interact: boolean;
  readonly openDoor: boolean;
}

/**
 * Loop metrics captured around a frame. All times are in milliseconds.
 */
export interface LoopMetrics {
  readonly frame: number;
  readonly dt: number;
  readonly simMs: number;
  readonly renderMs: number;
  readonly blitMs: number;
}

/**
 * Immutable context passed to the frame runner.
 */
export interface FrameContext {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
}
