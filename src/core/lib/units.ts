// Los pesos se guardan SIEMPRE en kg (DECISIONES D-010). Aquí solo se convierten
// para mostrarlos o para leer lo que escribe el usuario en su unidad.

export const WEIGHT_UNITS = ['kg', 'lb'] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg';

/**
 * Unidad inicial de una cuenta nueva (DECISIONES D-058): libras si el dispositivo
 * está en inglés de EE. UU.; kilos en el resto. El usuario la cambia en su perfil.
 */
export function defaultWeightUnitFor(languageTag: string | undefined): WeightUnit {
  return languageTag?.toLowerCase() === 'en-us' ? 'lb' : DEFAULT_WEIGHT_UNIT;
}

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

// Las medidas corporales se guardan SIEMPRE en cm. Quien usa libras las ve en
// pulgadas (D-127): la unidad de longitud sigue a la de peso.
export type LengthUnit = 'cm' | 'in';

const CM_PER_IN = 2.54;

export function lengthUnitFor(unit: WeightUnit): LengthUnit {
  return unit === 'lb' ? 'in' : 'cm';
}

/** Convierte una medida guardada (cm) a la unidad de longitud del usuario. */
export function fromCm(cm: number, unit: WeightUnit): number {
  return unit === 'lb' ? cm / CM_PER_IN : cm;
}

/** Convierte lo que escribe el usuario en su unidad (cm o pulgadas) a cm, para guardarlo. */
export function toCm(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * CM_PER_IN : value;
}

/** Texto listo para mostrar: número en el formato del idioma + cm o in. */
export function formatLength(cm: number, unit: WeightUnit, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return `${formatter.format(fromCm(cm, unit))} ${lengthUnitFor(unit)}`;
}
