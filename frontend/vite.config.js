import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api/* is forwarded to the PHP API (started by dev.js on port 8000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
