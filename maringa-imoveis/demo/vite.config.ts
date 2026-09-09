import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(demoDir, '..');

export default defineConfig({
  plugins: [react()],
  // Relative paths work on GitHub Pages subpaths and local static servers.
  base: './',
  build: {
    outDir: 'dist',
    emptyDir: true,
    rollupOptions: {
      input: path.resolve(demoDir, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@maringa-imoveis-map': path.resolve(siteRoot, 'component/src'),
    },
  },
});
