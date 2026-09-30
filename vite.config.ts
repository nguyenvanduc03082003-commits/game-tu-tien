import { appearancePlugin } from './scripts/appearance-catalog.mjs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [appearancePlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'esnext'
  }
});
