import type { Brand, BrandMode } from './brand-schema';
import { ensureContrast, pickReadableOn } from './contrast';

// Convierte la marca de un coach en las variables CSS que usan todos los
// componentes (ARQUITECTURA §10). El coach elige dos colores y el modo; los
// tonos neutros los pone la plataforma para que la app siempre sea legible.

interface ModePalette {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  danger: string;
}

// Neutros PRIME (D-prime1-1): un negro casi puro y un gris perla. El cristal de
// las tarjetas se deriva de estos en `src/index.css`.
const MODE_PALETTES: Record<BrandMode, ModePalette> = {
  dark: {
    background: '#050506',
    surface: '#121215',
    foreground: '#f5f5f7',
    muted: '#9d9da6',
    border: '#2a2a30',
    danger: '#ff6b6b',
  },
  light: {
    background: '#e9eaee',
    surface: '#ffffff',
    foreground: '#0b0b0e',
    muted: '#5a5a63',
    border: '#d3d4da',
    danger: '#c62828',
  },
};

export const BRAND_CSS_VARIABLES = [
  '--brand-primary',
  '--brand-on-primary',
  '--brand-primary-readable',
  '--brand-accent',
  '--brand-on-accent',
  '--brand-background',
  '--brand-surface',
  '--brand-foreground',
  '--brand-muted',
  '--brand-border',
  '--brand-danger',
] as const;

export type BrandCssVariable = (typeof BRAND_CSS_VARIABLES)[number];

export type BrandCssVars = Record<BrandCssVariable, string>;

export function brandToCssVars(brand: Brand): BrandCssVars {
  const palette = MODE_PALETTES[brand.mode];
  const primary = brand.colors.primary.toLowerCase();
  const accent = brand.colors.accent.toLowerCase();

  // El color principal también se usa como texto (enlaces, elemento activo del
  // menú). Ahí tiene que leerse sobre los dos fondos de la app.
  const primaryReadable = ensureContrast(
    ensureContrast(primary, palette.background),
    palette.surface,
  );

  return {
    '--brand-primary': primary,
    '--brand-on-primary': pickReadableOn(primary),
    '--brand-primary-readable': primaryReadable,
    '--brand-accent': accent,
    '--brand-on-accent': pickReadableOn(accent),
    '--brand-background': palette.background,
    '--brand-surface': palette.surface,
    '--brand-foreground': palette.foreground,
    '--brand-muted': palette.muted,
    '--brand-border': palette.border,
    '--brand-danger': palette.danger,
  };
}

/** Aplica la marca al documento: a partir de aquí toda la app pinta con ella. */
export function applyBrandToElement(brand: Brand, element: HTMLElement): void {
  const vars = brandToCssVars(brand);
  for (const name of BRAND_CSS_VARIABLES) {
    element.style.setProperty(name, vars[name]);
  }
  // Para que los controles nativos (scroll, selects) sigan el modo de la marca.
  element.style.colorScheme = brand.mode;
  // Para lo que depende del modo y no es un color (variante `light:` de index.css).
  element.dataset.mode = brand.mode;
}
