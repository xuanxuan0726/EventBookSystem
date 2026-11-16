import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api/* and /uploads/* are forwarded to the PHP server (started by dev.js on port 8000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Uploaded event cover images are served by the PHP server
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
