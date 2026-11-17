import { describe, expect, it } from 'vitest';

import {
  compareExercisePerformance,
  findPreviousExerciseSets,
  formatDuration,
  formatDurationBetween,
  formatExerciseSetsExcel,
  formatSetExcel,
} from './workout-format';
import type { WorkoutSetRecord } from './workout-types';

function createSet(overrides: Partial<WorkoutSetRecord> = {}): WorkoutSetRecord {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    workout_exercise_id: '00000000-0000-0000-0000-000000000002',
    set_number: 1,
    side: 'none',
    weight_kg: 45,
    reps: 8,
    duration_seconds: null,
    distance_meters: null,
    intensity_type: 'rir',
    intensity_value: 1,
    is_done: true,
    is_extra: false,
    recorded_at: '2026-11-17T10:00:00Z',
    ...overrides,
  };
}

describe('workout-format', () => {
  describe('formatSetExcel', () => {
    it('formatea series normales con peso, repeticiones y RIR', () => {
      expect(
        formatSetExcel(
          createSet({ weight_kg: 45, reps: 8, intensity_type: 'rir', intensity_value: 1 }),
        ),
      ).toBe('45×8(1)');
      expect(
        formatSetExcel(
          createSet({ weight_kg: 82.5, reps: 10, intensity_type: 'rir', intensity_value: 0 }),
        ),
      ).toBe('82.5×10(0)');
    });

    it('formatea series con RPE', () => {
      expect(
        formatSetExcel(
          createSet({ weight_kg: 80, reps: 6, intensity_type: 'rpe', intensity_value: 8 }),
        ),
      ).toBe('80×6(@8)');
    });

    it('formatea series al fallo', () => {
      expect(formatSetExcel(createSet({ weight_kg: 45, reps: 8, intensity_type: 'failure' }))).toBe(
        '45×8(F)',
      );
    });

    it('formatea unilaterales con prefijo D: o I:', () => {
      expect(
        formatSetExcel(
          createSet({
            side: 'right',
            weight_kg: 30,
            reps: 9,
            intensity_type: 'rir',
            intensity_value: 1,
          }),
        ),
      ).toBe('D: 30×9(1)');
      expect(
        formatSetExcel(
          createSet({
            side: 'left',
            weight_kg: 30,
            reps: 8,
            intensity_type: 'rir',
            intensity_value: 1,
          }),
        ),
      ).toBe('I: 30×8(1)');
    });

    it('formatea ejercicios de tiempo y distancia', () => {
      expect(
        formatSetExcel(
          createSet({
            duration_seconds: 45,
            weight_kg: null,
            reps: null,
            intensity_type: null,
            intensity_value: null,
          }),
        ),
      ).toBe('45s');
      expect(
        formatSetExcel(
          createSet({
            distance_meters: 400,
            weight_kg: null,
            reps: null,
            intensity_type: null,
            intensity_value: null,
          }),
        ),
      ).toBe('400m');
    });

    it('formatea ejercicios de autocarga (peso corporal 0 o null)', () => {
      expect(
        formatSetExcel(
          createSet({ weight_kg: 0, reps: 12, intensity_type: 'rir', intensity_value: 1 }),
        ),
      ).toBe('12(1)');
    });
  });

  describe('formatExerciseSetsExcel', () => {
    it('une varias series hechas con /', () => {
      const sets = [
        createSet({ set_number: 1, weight_kg: 45, reps: 8, intensity_value: 1 }),
        createSet({ set_number: 2, weight_kg: 45, reps: 7, intensity_value: 1 }),
      ];
      expect(formatExerciseSetsExcel(sets)).toBe('45×8(1) / 45×7(1)');
    });

    it('ignora series no hechas (is_done: false)', () => {
      const sets = [
        createSet({ set_number: 1, weight_kg: 45, reps: 8, is_done: true }),
        createSet({ set_number: 2, weight_kg: 45, reps: 8, is_done: false }),
      ];
      expect(formatExerciseSetsExcel(sets)).toBe('45×8(1)');
    });

    it('devuelve raya si no hay series hechas', () => {
      expect(formatExerciseSetsExcel([createSet({ is_done: false })])).toBe('—');
      expect(formatExerciseSetsExcel([])).toBe('—');
    });
  });

  describe('formatDuration y formatDurationBetween', () => {
    it('formatea minutos y horas', () => {
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(60)).toBe('1 h');
      expect(formatDuration(75)).toBe('1 h 15 min');
    });

    it('calcula la duración entre dos fechas', () => {
      expect(formatDurationBetween('2026-11-17T10:00:00Z', '2026-11-17T10:45:00Z')).toBe('45 min');
      expect(formatDurationBetween('2026-11-17T10:00:00Z', null)).toBeNull();
    });
  });

  describe('compareExercisePerformance', () => {
    it('devuelve null si no hay anterior', () => {
      expect(compareExercisePerformance([createSet()], null)).toBeNull();
      expect(compareExercisePerformance([createSet()], [])).toBeNull();
    });

    it('devuelve up si subió peso o repeticiones', () => {
      const prev = [createSet({ weight_kg: 40, reps: 8 })];
      const curr = [createSet({ weight_kg: 45, reps: 8 })];
      expect(compareExercisePerformance(curr, prev)).toBe('up');
    });

    it('devuelve down si bajó peso o repeticiones', () => {
      const prev = [createSet({ weight_kg: 45, reps: 8 })];
      const curr = [createSet({ weight_kg: 40, reps: 8 })];
      expect(compareExercisePerformance(curr, prev)).toBe('down');
    });

    it('devuelve same si es igual', () => {
      const prev = [createSet({ weight_kg: 45, reps: 8 })];
      const curr = [createSet({ weight_kg: 45, reps: 8 })];
      expect(compareExercisePerformance(curr, prev)).toBe('same');
    });
  });

  describe('findPreviousExerciseSets', () => {
    it('encuentra el ejercicio en el mismo día anterior de la rutina', () => {
      const exId = '00000000-0000-0000-0000-000000000010';
      const setsToday = [createSet({ weight_kg: 45 })];
      const setsPrev = [createSet({ weight_kg: 40 })];

      const workouts = [
        {
          id: 'w1',
          day_number: 1,
          workout_exercises: [{ exercise_id: exId, is_skipped: false, workout_sets: setsToday }],
        },
        {
          id: 'w2',
          day_number: 2,
          workout_exercises: [
            { exercise_id: exId, is_skipped: false, workout_sets: [createSet({ weight_kg: 35 })] },
          ],
        },
        {
          id: 'w3',
          day_number: 1,
          workout_exercises: [{ exercise_id: exId, is_skipped: false, workout_sets: setsPrev }],
        },
      ];

      expect(findPreviousExerciseSets(workouts, 'w1', exId)).toEqual(setsPrev);
    });

    it('devuelve null si no hay anterior', () => {
      const exId = '00000000-0000-0000-0000-000000000010';
      const workouts = [
        {
          id: 'w1',
          day_number: 1,
          workout_exercises: [
            { exercise_id: exId, is_skipped: false, workout_sets: [createSet()] },
          ],
        },
      ];
      expect(findPreviousExerciseSets(workouts, 'w1', exId)).toBeNull();
    });
  });
});
