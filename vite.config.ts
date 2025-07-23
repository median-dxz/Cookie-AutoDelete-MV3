import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest';
import * as DIR from './tools/directories';

export default defineConfig({
  publicDir: DIR.EXT,
  build: {
    outDir: DIR.BUILDS,
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({ outDir: DIR.BUILDS, outFileName: 'release.zip' }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'mixed-decls',
          'color-functions',
          'global-builtin',
        ],
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
    },
  },
});
