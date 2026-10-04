import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    include: ['src/engine/__tests__/**/*.test.js', 'src/**/*.test.js'],
    environment: 'node',
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@tycoon/db': path.resolve(__dirname, '../db/index.js'),
    },
  },
});
