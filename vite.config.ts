import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const devPublicUrl = process.env.VITE_PUBLIC_URL;
const devOrigin = devPublicUrl ? new URL(devPublicUrl) : null;
const entryPoints = {
  main: path.resolve(rootDir, "src/ts/main.ts"),
  whiteboard: path.resolve(rootDir, "src/ts/whiteboard.ts"),
  garden: path.resolve(rootDir, "src/ts/garden.ts"),
};

export default defineConfig(({ command, mode }) => {
  const isDebugBuild = command === "build" && mode === "development";

  return {
    appType: "custom",
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
    publicDir: false,
    server: {
      cors: true,
      host: process.env.VITE_HOST || "0.0.0.0",
      port: 5173,
      strictPort: true,
      origin: devPublicUrl,
      hmr: devOrigin
        ? {
            host: devOrigin.hostname,
            port: Number(devOrigin.port) || 5173,
            protocol: devOrigin.protocol === "https:" ? "wss" : "ws",
          }
        : undefined,
    },
    build: {
      cssCodeSplit: false,
      emptyOutDir: false,
      minify: isDebugBuild ? false : "esbuild",
      outDir: path.resolve(rootDir, "assets"),
      rollupOptions: {
        input: entryPoints,
        output: {
          entryFileNames: ({ name }) => {
            const suffix = isDebugBuild ? "" : ".min";

            return `js/${name}${suffix}.js`;
          },
        },
      },
      target: "es2020",
    },
  };
});
