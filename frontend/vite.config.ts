import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_PROXY_TARGET / VITE_USE_POLLING are read here (Node process, build
// time), separate from VITE_API_URL which is read in the browser bundle via
// import.meta.env. Only Docker dev sets them; outside Docker this is a no-op.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
  },
});
