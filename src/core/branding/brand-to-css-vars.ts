import type { Brand, BrandMode } from './brand-schema';
import { ensureContrast, pickReadableOn } from './contrast';

// Convierte la marca de un coach en las variables CSS que usan todos los
// componentes (ARQUITECTURA §10). El coach elige dos colores y el modo; los
// tonos neutros los pone la plataforma para que la app siempre sea legible.

interface ModePalette {
  background: string;
  surface: string;
  /** Capa por encima de la superficie: campos, chips y tarjetas destacadas. */
  raised: string;
  foreground: string;
  muted: string;
  border: string;
  danger: string;
}

// Neutros cálidos (tirando a piedra, no a azul): dan profundidad y dejan que el
// color del coach sea la única luz de la pantalla.
const MODE_PALETTES: Record<BrandMode, ModePalette> = {
  dark: {
    background: '#0e0d0b',
    surface: '#171512',
    raised: '#211e1a',
    foreground: '#f5f1ea',
    muted: '#a59e93',
    border: '#2c2824',
    danger: '#ff8a78',
  },
  light: {
    background: '#f4f0e9',
    surface: '#fffdf9',
    raised: '#ffffff',
    foreground: '#1a1714',
    muted: '#675f55',
    border: '#e2dcd2',
    danger: '#b42318',
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
  '--brand-raised',
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
    '--brand-raised': palette.raised,
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
  // Para los estilos que dependen del modo y no son un color (el grano de fondo).
  element.dataset.mode = brand.mode;
}
