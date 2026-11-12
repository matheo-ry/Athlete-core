// Los pesos se guardan SIEMPRE en kg (DECISIONES D-010). Aquí solo se convierten
// para mostrarlos o para leer lo que escribe el usuario en su unidad.

export const WEIGHT_UNITS = ['kg', 'lb'] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg';

// Valor exacto de la libra internacional.
const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Convierte un peso guardado (kg) a la unidad que prefiere el usuario. */
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kgToLb(kg) : kg;
}

/** Convierte lo que escribe el usuario en su unidad a kg, para guardarlo. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? lbToKg(value) : value;
}

/** Texto listo para mostrar: número en el formato del idioma + unidad. */
export function formatWeight(kg: number, unit: WeightUnit, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return `${formatter.format(fromKg(kg, unit))} ${unit}`;
}
