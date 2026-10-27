import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // config/api.axios.ts falla al cargarse si falta esta variable (no tiene valor por defecto).
    env: { NEXT_PUBLIC_API_URL: 'http://localhost:9091/api/v1' },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/setup.ts',
        '**/*.d.ts',
        'next.config.js',
        'postcss.config.js',
        'tailwind.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@ui': path.resolve(__dirname, './components/ui'),
      '@admin': path.resolve(__dirname, './modules/admin'),
      '@auth': path.resolve(__dirname, './modules/auth'),
      '@utils': path.resolve(__dirname, './utils'),
      '@store': path.resolve(__dirname, './store'),
    },
  },
});
