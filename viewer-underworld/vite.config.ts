import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@osric/renderer-underworld': resolve(__dirname, '../renderer-underworld/index.ts'),
      '@osric/osric-engine': resolve(__dirname, '../osric-engine/index.ts'),
      '@osric/engine': resolve(__dirname, '../engine/index.ts'),
    },
  },
});
