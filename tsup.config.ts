import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "core/index.ts",
    "expo/index": "expo/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  shims: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "react-native",
    "expo-secure-store",
    "@google/genai",
    "zod"
  ],
});
