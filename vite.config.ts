import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@domains': path.resolve(__dirname, 'src/domains'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@repositories': path.resolve(__dirname, 'src/repositories'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    },
  },
});
