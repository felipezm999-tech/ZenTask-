import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "../resources/static",
        emptyOutDir: true
    },
    server: {
        host: "localhost",
        port: 5173,
        strictPort: true,
        proxy: {
            "/tarefas": "http://localhost:8080"
        }
    }
});
