import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import manifestJson from './manifest.json';
import packageJson from './package.json';
import * as DIR from './tools/directories';

type FixEmailFields<T> = {
  [TKey in keyof T]: TKey extends 'author' ? { email: string } : T[TKey];
};

const manifest = {
  ...manifestJson,
  version: packageJson.version,
} as unknown as FixEmailFields<typeof manifestJson>;

export default defineConfig({
  publicDir: DIR.EXT,
  build: {
    outDir: DIR.DIST,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('react') ||
            id.includes('redux') ||
            id.includes('fontawsome')
          ) {
            return 'react';
          }
          if (id.includes('webextension-polyfill')) {
            return 'webextension-polyfill';
          }
        },
      },
    },
  },
  plugins: [react(), crx({ manifest })],
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
