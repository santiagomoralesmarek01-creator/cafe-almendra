import { resolve } from "node:path";
import { defineConfig } from "vite";

// Dos páginas: la web de pedidos (/) y la carta del salón (/carta), a la que lleva el QR de las mesas.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        web: resolve(import.meta.dirname, "index.html"),
        carta: resolve(import.meta.dirname, "carta.html"),
      },
    },
  },
});
