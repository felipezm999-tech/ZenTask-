import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "../resources/static",
        // Preserva os arquivos estáticos já existentes durante a compilação.
        emptyOutDir: false
    },
    server: {
        host: "localhost",
        port: 5173,
        strictPort: true,
        proxy: {
            "/tarefas": "http://localhost:8080",
            "/categorias": "http://localhost:8080"
        }
    }
});
