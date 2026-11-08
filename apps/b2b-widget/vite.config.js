import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.js'),
      name: 'UniversalSizeWidget',
      fileName: () => 'size-widget.iife.js',
      formats: ['iife']
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true
      }
    }
  },
  server: {
    port: 5174,
    cors: true
  }
});
