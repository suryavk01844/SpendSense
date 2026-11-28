import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Relative base + HashRouter = works on any GitHub Pages path.
export default defineConfig({ base: "./", plugins: [react()] });
