// Los 12 colores que el coach puede elegir con un toque (D-057). También puede
// escribir uno propio. Cada uno tiene una clave de texto para su nombre, que
// leen los lectores de pantalla. Los dos primeros y el naranja son los de
// ATHLETE CORE; el verde azulado y el rojo, los de los negocios del seed.

export const BRAND_PALETTE = [
  { key: 'blue', hex: '#2563EB' },
  { key: 'sky', hex: '#0EA5E9' },
  { key: 'teal', hex: '#0F766E' },
  { key: 'green', hex: '#16A34A' },
  { key: 'lime', hex: '#65A30D' },
  { key: 'yellow', hex: '#EAB308' },
  { key: 'orange', hex: '#FF7A1A' },
  { key: 'red', hex: '#DC2626' },
  { key: 'pink', hex: '#DB2777' },
  { key: 'purple', hex: '#7C3AED' },
  { key: 'indigo', hex: '#4F46E5' },
  { key: 'slate', hex: '#475569' },
] as const;

export type PaletteColor = (typeof BRAND_PALETTE)[number];

/**
 * Un color escrito a mano, como lo guarda la base de datos: `#` y 6 cifras
 * hexadecimales en mayúsculas. Acepta que falte el `#` y los espacios de
 * alrededor. Si no es un color, `null`.
 */
export function normalizeHexColor(input: string): string | null {
  const value = input.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(value) ? `#${value.toUpperCase()}` : null;
}
