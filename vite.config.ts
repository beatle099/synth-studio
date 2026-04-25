import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Dev server runs at /; production build is hosted at /synth-studio/ on GitHub Pages.
  base: command === 'build' ? '/synth-studio/' : '/',
  plugins: [react()],
}));
