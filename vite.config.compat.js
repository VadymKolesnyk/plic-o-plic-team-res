import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [
          ['@babel/preset-env', {
            targets: '> 0.5%, last 2 versions, not dead, ie 11',
            useBuiltIns: false,
            // Do NOT transform modules — rollup handles that
            modules: false,
          }],
        ],
      },
    }),
    viteSingleFile(),
  ],
  base: './',
  build: {
    target: 'es2015',
    outDir: 'dist-compat',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
