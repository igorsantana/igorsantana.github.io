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
  server: {
    proxy: {
      '/api': {
        target: 'https://beta-api.sub100.com.br/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          Origin: 'https://sub100.com.br',
          Referer: 'https://sub100.com.br/',
        },
      },
    },
  },
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
      // Single React instance — component/ has its own node_modules for typecheck only.
      react: path.resolve(demoDir, 'node_modules/react'),
      'react-dom': path.resolve(demoDir, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
