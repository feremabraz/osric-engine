import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@tests': resolve(__dirname, './__tests__'),
      '@osric/engine': resolve(__dirname, './engine/index.ts'),
      '@osric/osric-engine': resolve(__dirname, './osric-engine/index.ts'),
      '@osric/renderer-underworld': resolve(__dirname, './renderer-underworld/index.ts'),
    },
  },
});
