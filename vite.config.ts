import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Dev server runs at /; production build is hosted at /synth-studio/ on GitHub Pages.
  base: command === 'build' ? '/synth-studio/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Landing page (static HTML, no React).
        main: resolve(__dirname, 'index.html'),
        // Synth app (React entry).
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
}));
