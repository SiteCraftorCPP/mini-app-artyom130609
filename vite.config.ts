import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: {
        exportType: "default",
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: "**/*.svg",
    }),
  ],
  server: {
    cors: true,
    /** Для dev: бот с ORDER_NOTIFY на 127.0.0.1:8788 — те же пути, что в nginx на проде */
    proxy: {
      "/api": { target: "http://127.0.0.1:8788", changeOrigin: true },
      "/notify": { target: "http://127.0.0.1:8788", changeOrigin: true },
    },
    allowedHosts: [
      "*",
      "affably-striving-suricate.cloudpub.ru",
      "seriously-calm-rockfish.cloudpub.ru",
      "doubly-upbeat-gobbler.cloudpub.ru",
      "localhost:5001",
      "ponderously-musical-ringtail.cloudpub.ru",
    ],
  },
});
