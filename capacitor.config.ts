import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor empaqueta la misma app web para iOS y Android (ARQUITECTURA §12).
// En la Fase 0 solo existe esta configuración: las plataformas nativas
// (android/, ios/) se generan en la Fase 4.
const config: CapacitorConfig = {
  // Identificador PROVISIONAL. Hay que fijar el definitivo antes de publicar en
  // las tiendas: después ya no se puede cambiar sin publicar una app nueva.
  appId: 'app.athletecore.mobile',
  appName: 'ATHLETE CORE',
  webDir: 'dist',
};

export default config;
