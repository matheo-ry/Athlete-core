import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor empaqueta la misma app web para iOS y Android (ARQUITECTURA §12).
// android/ existe desde el PR 3.1 (guía en android/README.md); ios/ llega en la
// Fase 4. Tras cambiar este archivo hay que ejecutar `npx cap sync`.
const config: CapacitorConfig = {
  // Identificador PROVISIONAL. Hay que fijar el definitivo antes de publicar en
  // las tiendas: después ya no se puede cambiar sin publicar una app nueva.
  appId: 'app.athletecore.mobile',
  appName: 'ATHLETE CORE',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      // Capacitor pasa el tamaño de las barras del sistema a la web como
      // variables CSS (--safe-area-inset-*), que usa src/index.css.
      insetsHandling: 'css',
      // index.html ya pide `viewport-fit=cover`: evita un salto al arrancar.
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
