import type { Brand } from './brand-schema';

// Marca de la plataforma: la que se ve antes de unirse a un coach y la que se usa
// si la marca de un coach no es válida. Si cambias estos colores, actualiza
// también los valores por defecto de `src/index.css`.
export const DEFAULT_BRAND: Brand = {
  appName: 'ATHLETE CORE',
  logoPath: null,
  colors: { primary: '#2563EB', accent: '#FF7A1A' },
  mode: 'dark',
};
