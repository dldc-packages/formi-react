/* eslint-disable no-var */
import { defineConfig } from 'vite';
import path from 'path';
import pkg from './package.json';

var external: Array<string> = Object.keys(pkg.dependencies).concat(
  Object.keys(pkg.peerDependencies),
  'use-sync-external-store/extra'
);

export default defineConfig({
  build: {
    lib: {
      formats: ['es', 'cjs'],
      entry: path.resolve(process.cwd(), 'src/index.ts'),
      name: 'Dcosy',
      fileName: (format) => `react-formi.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external,
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
});
