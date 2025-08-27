/** Node-only texture loaders (uses `node:fs` and `pngjs`). Not available in browsers. */
export * as NodeLoaders from './loaders.node';
/** Browser texture loader (uses `fetch` + Canvas/ImageBitmap). Not available in Node. */
export * as BrowserLoaders from './loaders.browser';
