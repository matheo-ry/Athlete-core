import { toCm } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';

import { parseDecimal } from './body-entry';
import type { BodyMeasurementRecord } from './workout-types';

// La lista cerrada de D-127, la misma que el `check` de `body_measurements.kind`.
export const MEASUREMENT_KINDS = [
  'waist',
  'hips',
  'chest',
  'shoulders',
  'neck',
  'arm',
  'thigh',
  'calf',
] as const;

export type MeasurementKind = (typeof MEASUREMENT_KINDS)[number];
export type MeasurementSide = 'left' | 'right';

/** Brazo, muslo y gemelo se miden por lados; la base de datos exige lado en ellos y solo en ellos. */
const SIDED_KINDS: ReadonlySet<string> = new Set<MeasurementKind>(['arm', 'thigh', 'calf']);

export const MAX_MEASUREMENT_CM = 300;

export interface MeasurementTarget {
  kind: MeasurementKind;
  side: MeasurementSide | null;
}

export function hasSides(kind: MeasurementKind): boolean {
  return SIDED_KINDS.has(kind);
}

/** Clave de cada medida: el tipo y, si lo tiene, el lado ("arm-right"). */
export function targetKey(target: MeasurementTarget): string {
  return target.side === null ? target.kind : `${target.kind}-${target.side}`;
}

/** Todas las medidas que se pueden apuntar, en el orden de D-127, con sus lados. */
export function measurementTargets(): MeasurementTarget[] {
  return MEASUREMENT_KINDS.flatMap((kind): MeasurementTarget[] =>
    hasSides(kind)
      ? [
          { kind, side: 'right' },
          { kind, side: 'left' },
        ]
      : [{ kind, side: null }],
  );
}

/** La medida a la que se refiere una clave de `targetKey`; `null` si no es de la lista. */
export function parseTargetKey(key: string): MeasurementTarget | null {
  return measurementTargets().find((target) => targetKey(target) === key) ?? null;
}

export type MeasurementEntryResult =
  { ok: true; valueCm: number } | { ok: false; reason: 'invalid' | 'range' };

/** La medida escrita en cm o pulgadas, lista para guardar en cm con un decimal. */
export function parseMeasurementEntry(text: string, unit: WeightUnit): MeasurementEntryResult {
  const value = parseDecimal(text);
  if (value === null) {
    return { ok: false, reason: 'invalid' };
  }
  const cm = Math.round(toCm(value, unit) * 10) / 10;
  return cm > 0 && cm <= MAX_MEASUREMENT_CM
    ? { ok: true, valueCm: cm }
    : { ok: false, reason: 'range' };
}

export interface MeasurementHistory {
  target: MeasurementTarget;
  key: string;
  /** Del día más reciente al más antiguo. */
  records: BodyMeasurementRecord[];
}

/**
 * Las medidas agrupadas por tipo y lado, en el orden de D-127, solo las que
 * tienen algo apuntado. Lo que no está en la lista (no debería pasar) se ignora.
 */
export function groupMeasurementHistory(
  measurements: readonly BodyMeasurementRecord[],
): MeasurementHistory[] {
  return measurementTargets().flatMap((target): MeasurementHistory[] => {
    const key = targetKey(target);
    const records = measurements
      .filter((m) => m.kind === target.kind && (m.side ?? null) === target.side)
      .sort((a, b) => b.measured_on.localeCompare(a.measured_on));
    return records.length === 0 ? [] : [{ target, key, records }];
  });
}
