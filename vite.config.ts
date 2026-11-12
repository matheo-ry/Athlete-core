import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // El alias "@/" apunta a "src/". Tiene que coincidir con "paths" de
    // tsconfig.app.json y con scripts/eslint-alias-resolver.cjs.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Las librerías van en archivos aparte del código de la app: cambian
        // mucho menos, así el navegador las reutiliza entre versiones.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 2,
            },
            { name: 'vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Los tests unitarios viven junto al archivo que prueban. Los de flujos
    // completos (e2e/) los ejecuta Playwright, no Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
