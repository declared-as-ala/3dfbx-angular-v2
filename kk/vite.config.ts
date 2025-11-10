import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 4200,
    open: true,
    cors: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          'three': ['three'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three'],
    esbuildOptions: {
      target: 'esnext',
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
    },
  },
});

