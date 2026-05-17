import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "/mstravel/scroller/",
  server: {
    host: "::",
    port: 19012,
    allowedHosts: ["desktop-lmj0ssr.tail785a84.ts.net", ".tail785a84.ts.net", "localhost"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
