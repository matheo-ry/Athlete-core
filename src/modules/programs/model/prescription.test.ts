import { describe, expect, it } from 'vitest';

import { emptySet, newDayExercise } from './day-exercises';
import {
  areSetsUniform,
  formatRest,
  intensityKey,
  intensityValues,
  loadText,
  makeSetsUniform,
  parseIntensityKey,
  parseLoad,
  parseTarget,
  prescriptionSummary,
  setSetCount,
  targetKindOf,
  targetText,
  updateSets,
} from './prescription';
import type { ProgramDayExercise } from './program-document';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const OPTIONS = { failureLabel: 'Al fallo', unit: 'kg', locale: 'es' } as const;

/** 3 series de 8 a 12 con RIR 1 y 2 minutos de descanso. */
function standard(): ProgramDayExercise {
  const item = updateSets(
    newDayExercise(uuid(1)),
    { repsMin: 8, repsMax: 12, intensityType: 'rir', intensityValue: 1 },
    'all',
  );
  return { ...item, restSeconds: 120 };
}

describe('lo prescrito en un ejercicio (PR 2.10, D-076)', () => {
  it('el resumen de una línea: "3 × 8-12 · RIR 1 · 2:00"', () => {
    expect(prescriptionSummary(standard(), OPTIONS)).toBe('3 × 8-12 · RIR 1 · 2:00');
    expect(prescriptionSummary(setSetCount(standard(), 2), OPTIONS)).toBe(
      '2 × 8-12 · RIR 1 · 2:00',
    );
  });

  it('el resumen con repeticiones fijas, RPE con medios, al fallo, carga, tiempo y distancia', () => {
    const fixed = updateSets(
      standard(),
      { repsMin: 5, repsMax: 5, intensityType: 'rpe', intensityValue: 7.5, targetLoadKg: 100 },
      'all',
    );
    expect(prescriptionSummary(fixed, OPTIONS)).toBe('3 × 5 · RPE 7.5 · 100 kg · 2:00');
    expect(prescriptionSummary(fixed, { ...OPTIONS, unit: 'lb', locale: 'en' })).toBe(
      '3 × 5 · RPE 7.5 · 220.5 lb · 2:00',
    );

    const plank = updateSets(newDayExercise(uuid(2)), { durationSeconds: 45 }, 'all');
    expect(prescriptionSummary(plank, OPTIONS)).toBe('3 × 45 s');
    const sled = updateSets(
      newDayExercise(uuid(3)),
      { distanceMeters: 400, intensityType: 'failure' },
      'all',
    );
    expect(prescriptionSummary(sled, OPTIONS)).toBe('3 × 400 m · Al fallo');
  });

  it('sin nada prescrito, el resumen es solo el número de series', () => {
    expect(prescriptionSummary(newDayExercise(uuid(1)), OPTIONS)).toBe('3');
    expect(prescriptionSummary({ ...newDayExercise(uuid(1)), restSeconds: 90 }, OPTIONS)).toBe(
      '3 · 1:30',
    );
  });

  it('con series distintas, agrupa las iguales seguidas', () => {
    let item = updateSets(standard(), { repsMin: 6, repsMax: 8 }, 0);
    item = updateSets(item, { repsMin: 10, intensityValue: 0 }, 1);
    item = updateSets(item, { repsMin: 10, intensityValue: 0 }, 2);

    expect(areSetsUniform(item.sets)).toBe(false);
    expect(prescriptionSummary(item, OPTIONS)).toBe('1 × 6-8 · RIR 1 + 2 × 10-12 · RIR 0 · 2:00');
  });

  it('cambiar el número de series copia la última o quita las del final, entre 1 y 10', () => {
    const saved = {
      ...standard(),
      sets: standard().sets.map((set, i) => ({ ...set, id: uuid(10 + i) })),
    };
    const more = setSetCount(saved, 5);
    expect(more.sets.map((set) => set.id)).toEqual([uuid(10), uuid(11), uuid(12), null, null]);
    expect(areSetsUniform(more.sets)).toBe(true);

    expect(setSetCount(saved, 1).sets.map((set) => set.id)).toEqual([uuid(10)]);
    expect(setSetCount(saved, 11).sets).toHaveLength(10);
    expect(setSetCount(saved, 0).sets).toHaveLength(1);
  });

  it('"todas iguales" toma lo de la primera y conserva los identificadores', () => {
    const saved = {
      ...standard(),
      sets: standard().sets.map((set, i) => ({ ...set, id: uuid(10 + i) })),
    };
    const mixed = updateSets(saved, { intensityType: 'failure', intensityValue: null }, 2);
    const uniform = makeSetsUniform(mixed);

    expect(areSetsUniform(uniform.sets)).toBe(true);
    expect(uniform.sets.map((set) => set.id)).toEqual([uuid(10), uuid(11), uuid(12)]);
    expect(uniform.sets[2]).toMatchObject({ intensityType: 'rir', intensityValue: 1 });
  });

  it('lee repeticiones fijas o en rango, segundos y metros; lo que no vale, no', () => {
    expect(parseTarget('8', 'reps')).toMatchObject({ repsMin: 8, repsMax: 8 });
    expect(parseTarget(' 8 - 12 ', 'reps')).toMatchObject({ repsMin: 8, repsMax: 12 });
    expect(parseTarget('', 'reps')).toMatchObject({ repsMin: null, repsMax: null });
    expect(parseTarget('45', 'time')).toMatchObject({ durationSeconds: 45, repsMin: null });
    expect(parseTarget('400', 'distance')).toMatchObject({ distanceMeters: 400 });
    for (const [text, kind] of [
      ['12-8', 'reps'],
      ['0', 'reps'],
      ['101', 'reps'],
      ['ocho', 'reps'],
      ['8.5', 'reps'],
      ['30-45', 'time'],
    ] as const) {
      expect(parseTarget(text, kind)).toBeNull();
    }
  });

  it('enseña en el campo lo que hay guardado, según la forma de medir', () => {
    const [set] = standard().sets;
    if (set === undefined) throw new Error('sin series');
    expect(targetText(set, 'reps')).toBe('8-12');
    expect(targetText({ ...set, repsMin: 10, repsMax: 10 }, 'reps')).toBe('10');
    expect(targetText({ ...emptySet(), durationSeconds: 45 }, 'time')).toBe('45');
    expect(targetText(emptySet(), 'distance')).toBe('');
    expect([
      targetKindOf('weight_reps'),
      targetKindOf('bodyweight_reps'),
      targetKindOf('time'),
    ]).toEqual(['reps', 'reps', 'time']);
  });

  it('la intensidad va y vuelve del desplegable; RIR de 0 a 10 y RPE de 1 a 10 con medios', () => {
    const [set] = standard().sets;
    if (set === undefined) throw new Error('sin series');
    expect(intensityKey(set)).toBe('rir:1');
    expect(parseIntensityKey('rpe:7.5')).toEqual({ intensityType: 'rpe', intensityValue: 7.5 });
    expect(parseIntensityKey('failure')).toEqual({
      intensityType: 'failure',
      intensityValue: null,
    });
    expect(parseIntensityKey('')).toEqual({ intensityType: null, intensityValue: null });
    expect(intensityKey({ ...set, ...parseIntensityKey('failure') })).toBe('failure');

    expect(intensityValues('rir')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(intensityValues('rpe').slice(0, 3)).toEqual([1, 1.5, 2]);
    expect(intensityValues('rpe').at(-1)).toBe(10);
  });

  it('el descanso se escribe en minutos y segundos', () => {
    expect([formatRest(120), formatRest(90), formatRest(45), formatRest(0)]).toEqual([
      '2:00',
      '1:30',
      '0:45',
      '0:00',
    ]);
  });
});

describe('la carga objetivo (PR 2.10b)', () => {
  it('se escribe en la unidad del usuario y se guarda en kg', () => {
    expect(parseLoad('10', 'kg')).toEqual({ targetLoadKg: 10 });
    expect(parseLoad('22,5', 'kg')).toEqual({ targetLoadKg: 22.5 });
    expect(parseLoad('22', 'lb')).toEqual({ targetLoadKg: 9.98 });
    expect(parseLoad('', 'lb')).toEqual({ targetLoadKg: null });
  });

  it('lo que no es un peso, o pasa de 1.000 kg, no vale', () => {
    for (const text of ['diez', '-5', '10.555', '1001']) {
      expect(parseLoad(text, 'kg')).toBeNull();
    }
    expect(parseLoad('2205', 'lb')).toBeNull();
    expect(parseLoad('2200', 'lb')).not.toBeNull();
  });

  it('se enseña en la unidad del usuario, con un decimal como mucho', () => {
    expect(loadText(10, 'kg')).toBe('10');
    expect(loadText(10, 'lb')).toBe('22');
    expect(loadText(9.98, 'lb')).toBe('22');
    expect(loadText(22.5, 'kg')).toBe('22.5');
    expect(loadText(null, 'kg')).toBe('');
  });
});
