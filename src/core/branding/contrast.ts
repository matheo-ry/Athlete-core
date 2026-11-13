// Cálculo de contraste según WCAG 2.x. Sirve para que el color que elige un coach
// nunca deje un texto ilegible (ARQUITECTURA §10).

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Contraste mínimo WCAG AA para texto normal. */
export const MIN_TEXT_CONTRAST = 4.5;

const WHITE = '#ffffff';
const BLACK = '#000000';
const ADJUST_STEPS = 20;

function hexToRgb(hex: string): Rgb {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error('Expected a 6-digit hex color');
  }
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** De 1 (sin contraste) a 21 (negro sobre blanco). */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

/**
 * Color del texto que va ENCIMA de un fondo de color: blanco o negro, el que más
 * contraste dé. Con blanco y negro PUROS el mejor de los dos siempre supera 4,5
 * (el peor caso posible es √21 ≈ 4,58), así que cualquier color de un coach
 * queda con un texto legible encima.
 */
export function pickReadableOn(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background) ? WHITE : BLACK;
}

/**
 * Devuelve `color` si ya se lee bien sobre `background`. Si no, lo aclara (fondo
 * oscuro) o lo oscurece (fondo claro) lo justo para llegar a `minRatio`.
 */
export function ensureContrast(
  color: string,
  background: string,
  minRatio: number = MIN_TEXT_CONTRAST,
): string {
  if (contrastRatio(color, background) >= minRatio) {
    return color.toLowerCase();
  }

  const target = pickReadableOn(background);
  for (let step = 1; step <= ADJUST_STEPS; step += 1) {
    const candidate = mix(color, target, step / ADJUST_STEPS);
    if (contrastRatio(candidate, background) >= minRatio) {
      return candidate;
    }
  }
  return target;
}
