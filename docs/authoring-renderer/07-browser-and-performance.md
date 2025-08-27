# Browser integration

## Browser upload

- Use `ImageData(texture.data, width, height)` and `putImageData` on a 2D canvas.
- For higher throughput, consider OffscreenCanvas and transferring frames to the main thread.

## Environment splits

- `assets/loaders` use conditional exports to avoid bundling Node deps in the browser.
- Verify with your bundler’s analyzer if in doubt.

## Micro‑perf tips

- Prefer the façade to avoid redundant setup.
- Keep framebuffer sizes modest; scale up with `blitNearestUpscaled`.
- Use smaller sprite atlases where possible; alpha‑discard is per‑pixel.
- Lighting/fog scale with resolution; adjust `fogDensity` to taste.

## Measuring

- In Node, use the provided `tools/bench.ts` script to estimate ms/frame.
- In browsers, measure with `requestAnimationFrame` and average over N frames.
