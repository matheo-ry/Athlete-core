import { toKg } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';

import { parseDecimal } from './body-entry';
import type { BodyWeightRecord } from './workout-types';

// Los mismos límites que `body_weights.weight_kg` en la base de datos.
export const MIN_BODY_WEIGHT_KG = 20;
export const MAX_BODY_WEIGHT_KG = 400;

export type WeightEntryResult =
  { ok: true; weightKg: number } | { ok: false; reason: 'invalid' | 'range' };

/**
 * El peso escrito en la unidad del cliente, listo para guardar en kg (con dos
 * decimales, como la columna). Se guarda siempre en kg (D-010).
 */
export function parseWeightEntry(text: string, unit: WeightUnit): WeightEntryResult {
  const value = parseDecimal(text);
  if (value === null) {
    return { ok: false, reason: 'invalid' };
  }
  const kg = Math.round(toKg(value, unit) * 100) / 100;
  if (kg < MIN_BODY_WEIGHT_KG || kg > MAX_BODY_WEIGHT_KG) {
    return { ok: false, reason: 'range' };
  }
  return { ok: true, weightKg: kg };
}

/** Lo más reciente primero (la base de datos no deja dos pesos el mismo día). */
export function sortWeightsNewestFirst(weights: readonly BodyWeightRecord[]): BodyWeightRecord[] {
  return [...weights].sort((a, b) => b.measured_on.localeCompare(a.measured_on));
}

/** El último peso apuntado, el del día más reciente. */
export function latestWeight(weights: readonly BodyWeightRecord[]): BodyWeightRecord | null {
  return sortWeightsNewestFirst(weights)[0] ?? null;
}

/**
 * Lo que pesa con el lastre puesto (D-127): peso corporal más lastre, en kg.
 * `null` si falta alguno de los dos, y entonces solo se enseña el lastre.
 */
export function totalWithBallast(bodyKg: number | null, ballastKg: number | null): number | null {
  if (bodyKg === null || ballastKg === null) {
    return null;
  }
  return Math.round((bodyKg + ballastKg) * 100) / 100;
}
