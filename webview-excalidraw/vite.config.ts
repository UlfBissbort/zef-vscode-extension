import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../assets/excalidraw-editor',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      output: {
        entryFileNames: 'excalidraw-editor.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  base: './'
});
