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
    // Dos grupos de tests unitarios. Los de flujos completos (e2e/) los ejecuta
    // Playwright, no Vitest.
    projects: [
      {
        // La app: cada test vive junto al archivo que prueba y se ejecuta en un
        // navegador simulado.
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          css: false,
          // Las variables de Supabase son obligatorias (D-025). Los tests no hablan
          // con ninguna base de datos (usan un AuthService falso): basta con que
          // tengan un valor válido.
          env: {
            VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
            VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
          },
        },
      },
      {
        // Las herramientas del repositorio (por ejemplo, el test de las
        // fronteras de arquitectura): se ejecutan en Node, sin navegador.
        extends: true,
        test: {
          name: 'tooling',
          environment: 'node',
          include: ['scripts/**/*.test.mjs'],
        },
      },
    ],
  },
});
