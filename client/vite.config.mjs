import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panelLoader: resolve(__dirname, 'panel-loader.jsx'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'panelLoader') return 'assets/panelLoader.js';
          return 'assets/[name]-[hash].js';
        }
      }
    }
  }
});