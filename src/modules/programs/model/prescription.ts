import { formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';

import type { ProgramDayExercise, ProgramSet } from './program-document';

// Lo prescrito en un ejercicio (PR 2.10, D-076): cuántas series y, en cada
// una, repeticiones (o tiempo, o distancia), intensidad y carga. Por dentro
// va siempre serie a serie; "una línea" es cuando todas son iguales.
// Lógica pura.

export const MAX_SETS = 10;

/** Qué se prescribe en vez de repeticiones, según la forma de medir (D-072). */
export type TargetKind = 'reps' | 'time' | 'distance';

export function targetKindOf(measurement: string): TargetKind {
  return measurement === 'time' ? 'time' : measurement === 'distance' ? 'distance' : 'reps';
}

type SetValues = Omit<ProgramSet, 'id'>;

function valuesOf(set: ProgramSet): SetValues {
  return {
    repsMin: set.repsMin,
    repsMax: set.repsMax,
    durationSeconds: set.durationSeconds,
    distanceMeters: set.distanceMeters,
    intensityType: set.intensityType,
    intensityValue: set.intensityValue,
    targetLoadKg: set.targetLoadKg,
  };
}

function sameValues(a: ProgramSet, b: ProgramSet): boolean {
  return JSON.stringify(valuesOf(a)) === JSON.stringify(valuesOf(b));
}

/** Todas las series piden lo mismo: se escribe en una sola línea. */
export function areSetsUniform(sets: readonly ProgramSet[]): boolean {
  const [first] = sets;
  return first === undefined || sets.every((set) => sameValues(set, first));
}

/** Cambia el número de series (1 a 10): las nuevas copian la última; sobran las del final. */
export function setSetCount(item: ProgramDayExercise, count: number): ProgramDayExercise {
  const size = Math.min(Math.max(Math.trunc(count), 1), MAX_SETS);
  const last = item.sets.at(-1);
  if (last === undefined || size <= item.sets.length) {
    return { ...item, sets: item.sets.slice(0, size) };
  }
  const added = Array.from({ length: size - item.sets.length }, () => ({ ...last, id: null }));
  return { ...item, sets: [...item.sets, ...added] };
}

/** Cambia una serie, o todas a la vez si se escribe en una sola línea. */
export function updateSets(
  item: ProgramDayExercise,
  patch: Partial<SetValues>,
  index: number | 'all',
): ProgramDayExercise {
  return {
    ...item,
    sets: item.sets.map((set, position) =>
      index === 'all' || index === position ? { ...set, ...patch } : set,
    ),
  };
}

/** Volver a "todas iguales": todas toman lo de la primera (PR 2.10). */
export function makeSetsUniform(item: ProgramDayExercise): ProgramDayExercise {
  const [first] = item.sets;
  return first === undefined ? item : updateSets(item, valuesOf(first), 'all');
}

// ----- Lo que escribe el coach -----

export type TargetPatch = Pick<
  SetValues,
  'repsMin' | 'repsMax' | 'durationSeconds' | 'distanceMeters'
>;

const NO_TARGET: TargetPatch = {
  repsMin: null,
  repsMax: null,
  durationSeconds: null,
  distanceMeters: null,
};

const TARGET_MAX: Record<TargetKind, number> = { reps: 100, time: 86_400, distance: 1_000_000 };

/**
 * Lee el campo de repeticiones ("8" o "8-12"), segundos o metros. Vacío es
 * "sin indicar". Devuelve `null` si lo escrito no vale.
 */
export function parseTarget(text: string, kind: TargetKind): TargetPatch | null {
  const clean = text.trim();
  if (clean === '') {
    return NO_TARGET;
  }
  const match = /^(\d{1,7})(?:\s*[-–]\s*(\d{1,7}))?$/.exec(clean);
  if (match === null) {
    return null;
  }
  const min = Number(match[1]);
  const max = match[2] === undefined ? min : Number(match[2]);
  if (min < 1 || max < min || max > TARGET_MAX[kind] || (kind !== 'reps' && max !== min)) {
    return null;
  }
  if (kind === 'time') {
    return { ...NO_TARGET, durationSeconds: min };
  }
  if (kind === 'distance') {
    return { ...NO_TARGET, distanceMeters: min };
  }
  return { ...NO_TARGET, repsMin: min, repsMax: max };
}

/** Lo que se enseña en ese campo. */
export function targetText(set: ProgramSet, kind: TargetKind): string {
  if (kind === 'time') {
    return set.durationSeconds === null ? '' : String(set.durationSeconds);
  }
  if (kind === 'distance') {
    return set.distanceMeters === null ? '' : String(set.distanceMeters);
  }
  if (set.repsMin === null || set.repsMax === null) {
    return '';
  }
  return set.repsMin === set.repsMax
    ? String(set.repsMin)
    : `${String(set.repsMin)}-${String(set.repsMax)}`;
}

export type IntensityScale = 'rir' | 'rpe';
export type IntensityPatch = Pick<SetValues, 'intensityType' | 'intensityValue'>;

/** La intensidad como texto de un desplegable: '', 'failure', 'rir:1', 'rpe:7.5'. */
export function intensityKey(set: ProgramSet): string {
  if (set.intensityType === null) {
    return '';
  }
  return set.intensityType === 'failure'
    ? 'failure'
    : `${set.intensityType}:${String(set.intensityValue)}`;
}

export function parseIntensityKey(key: string): IntensityPatch {
  const [type, value] = key.split(':');
  if (type === 'failure') {
    return { intensityType: 'failure', intensityValue: null };
  }
  if ((type === 'rir' || type === 'rpe') && value !== undefined) {
    return { intensityType: type, intensityValue: Number(value) };
  }
  return { intensityType: null, intensityValue: null };
}

/** Los valores que ofrece cada escala: RIR de 0 a 10; RPE de 1 a 10 con medios (D-076). */
export function intensityValues(scale: IntensityScale): number[] {
  return scale === 'rir'
    ? Array.from({ length: 11 }, (_, index) => index)
    : Array.from({ length: 19 }, (_, index) => 1 + index / 2);
}

// ----- El resumen de una línea -----

/** Descanso como "2:00" o "0:45". */
export function formatRest(seconds: number): string {
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface SummaryOptions {
  /** "Al fallo" en el idioma de la app. */
  failureLabel: string;
  unit: WeightUnit;
  locale: string;
}

function setSummary(set: ProgramSet, options: SummaryOptions): string[] {
  const target =
    set.durationSeconds !== null
      ? `${String(set.durationSeconds)} s`
      : set.distanceMeters !== null
        ? `${String(set.distanceMeters)} m`
        : targetText(set, 'reps');
  const intensity =
    set.intensityType === null
      ? ''
      : set.intensityType === 'failure'
        ? options.failureLabel
        : `${set.intensityType.toUpperCase()} ${String(set.intensityValue)}`;
  const load =
    set.targetLoadKg === null ? '' : formatWeight(set.targetLoadKg, options.unit, options.locale);
  return [target, intensity, load].filter((part) => part !== '');
}

/**
 * Lo prescrito en una línea: "3 × 8-12 · RIR 1 · 2:00". Si las series son
 * distintas, las iguales seguidas se agrupan: "1 × 6-8 · RIR 1 + 2 × 10-12 ·
 * RIR 0 · 2:00". Lo usan el editor, la vista del cliente y la ficha.
 */
export function prescriptionSummary(item: ProgramDayExercise, options: SummaryOptions): string {
  const groups: { count: number; set: ProgramSet }[] = [];
  for (const set of item.sets) {
    const previous = groups.at(-1);
    if (previous !== undefined && sameValues(previous.set, set)) {
      previous.count += 1;
    } else {
      groups.push({ count: 1, set });
    }
  }
  const sets = groups
    .map(({ count, set }) => {
      const parts = setSummary(set, options);
      const [first, ...rest] = parts;
      // Sin nada prescrito: "3 ×" a secas no dice nada; se queda en "3".
      return [first === undefined ? String(count) : `${String(count)} × ${first}`, ...rest].join(
        ' · ',
      );
    })
    .join(' + ');
  return item.restSeconds === null ? sets : `${sets} · ${formatRest(item.restSeconds)}`;
}
