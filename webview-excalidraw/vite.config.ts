/* +++
ET.TypeScriptFile('🍃-15881542cfdeec4d9949',
  tag_=[],
  created=Time('2026-01-28 13:00:46 +0800')
)
+++ */

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
