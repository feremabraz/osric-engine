import { blitNearestUpscaled, createFramebuffer } from '@osric/renderer-underworld';
import { describe, expect, it } from 'vitest';

describe('Phase 8: blit letterboxing behavior', () => {
  it('adds top/bottom letterbox bands when aspect differs', () => {
    const fb = createFramebuffer(320, 200, [20, 30, 40, 255]);
    const out = blitNearestUpscaled(fb, 800, 600, [0, 0, 0, 255]);
    expect(out.width).toBe(800);
    expect(out.height).toBe(600);
    // Expect 50px top/bottom bands for 320x200 -> 800x600
    const topMid = (0 * out.width + (out.width >> 1)) * 4;
    const botMid = ((out.height - 1) * out.width + (out.width >> 1)) * 4;
    expect(out.data[topMid]).toBe(0);
    expect(out.data[topMid + 1]).toBe(0);
    expect(out.data[topMid + 2]).toBe(0);
    expect(out.data[botMid]).toBe(0);
    expect(out.data[botMid + 1]).toBe(0);
    expect(out.data[botMid + 2]).toBe(0);
    // Center region should be non-black from the source buffer
    const center = ((out.height >> 1) * out.width + (out.width >> 1)) * 4;
    const sum = out.data[center] + out.data[center + 1] + out.data[center + 2];
    expect(sum).toBeGreaterThan(0);
  });

  it('no letterbox when aspect matches; corners come from image data', () => {
    const fb = createFramebuffer(320, 200, [10, 20, 30, 255]);
    const out = blitNearestUpscaled(fb, 640, 400, [0, 0, 0, 255]);
    // Corners should be scaled image colors, not the bg
    const tl = 0;
    const tr = ((0 * out.width + (out.width - 1)) * 4) | 0;
    const bl = (((out.height - 1) * out.width + 0) * 4) | 0;
    const br = (((out.height - 1) * out.width + (out.width - 1)) * 4) | 0;
    const isBg = (i: number) => out.data[i] === 0 && out.data[i + 1] === 0 && out.data[i + 2] === 0;
    expect(isBg(tl)).toBe(false);
    expect(isBg(tr)).toBe(false);
    expect(isBg(bl)).toBe(false);
    expect(isBg(br)).toBe(false);
  });
});
