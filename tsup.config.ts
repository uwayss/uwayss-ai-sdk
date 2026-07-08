import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'core/index': 'core/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  shims: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  external: ['@google/genai', 'zod'],
});
