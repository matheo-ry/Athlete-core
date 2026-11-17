import { describe, expect, it } from 'vitest';

import { formatSetText, groupWorkoutsByProgram } from './exercise-history';
import type { RawWorkout, RawWorkoutSet } from './exercise-history';

describe('formatSetText (D-129)', () => {
  it('formatea peso × repeticiones con RIR: 45×8(1)', () => {
    const set: RawWorkoutSet = {
      id: 's-1',
      set_number: 1,
      side: 'none',
      weight_kg: 45,
      reps: 8,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'rir',
      intensity_value: 1,
      is_done: true,
      recorded_at: '2026-11-17T18:00:00Z',
    };
    expect(formatSetText(set, 'weight_reps', false, 'es', 'kg')).toBe('45×8(1)');
  });

  it('formatea al fallo como (F)', () => {
    const set: RawWorkoutSet = {
      id: 's-2',
      set_number: 2,
      side: 'none',
      weight_kg: 45,
      reps: 6,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'failure',
      intensity_value: null,
      is_done: true,
      recorded_at: '2026-11-17T18:05:00Z',
    };
    expect(formatSetText(set, 'weight_reps', false, 'es', 'kg')).toBe('45×6(F)');
  });

  it('convierte RPE a RIR en el texto (RIR = 10 - RPE)', () => {
    const set: RawWorkoutSet = {
      id: 's-3',
      set_number: 1,
      side: 'none',
      weight_kg: 80,
      reps: 8,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'rpe',
      intensity_value: 8,
      is_done: true,
      recorded_at: '2026-11-17T18:00:00Z',
    };
    expect(formatSetText(set, 'weight_reps', false, 'es', 'kg')).toBe('80×8(2)');
  });

  it('añade prefijo D e I en unilaterales en español, y R / L en inglés', () => {
    const setR: RawWorkoutSet = {
      id: 's-r',
      set_number: 1,
      side: 'right',
      weight_kg: 30,
      reps: 9,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'rir',
      intensity_value: 1,
      is_done: true,
      recorded_at: '2026-11-17T18:00:00Z',
    };
    const setL: RawWorkoutSet = {
      id: 's-l',
      set_number: 1,
      side: 'left',
      weight_kg: 30,
      reps: 8,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'rir',
      intensity_value: 1,
      is_done: true,
      recorded_at: '2026-11-17T18:03:00Z',
    };

    expect(formatSetText(setR, 'weight_reps', true, 'es', 'kg')).toBe('D: 30×9(1)');
    expect(formatSetText(setL, 'weight_reps', true, 'es', 'kg')).toBe('I: 30×8(1)');
    expect(formatSetText(setR, 'weight_reps', true, 'en', 'kg')).toBe('R: 30×9(1)');
    expect(formatSetText(setL, 'weight_reps', true, 'en', 'kg')).toBe('L: 30×8(1)');
  });

  it('formatea ejercicios de tiempo y de distancia', () => {
    const setTime: RawWorkoutSet = {
      id: 's-t',
      set_number: 1,
      side: 'none',
      weight_kg: null,
      reps: null,
      duration_seconds: 45,
      distance_meters: null,
      intensity_type: 'rir',
      intensity_value: 1,
      is_done: true,
      recorded_at: '2026-11-17T18:00:00Z',
    };
    const setDist: RawWorkoutSet = {
      id: 's-d',
      set_number: 1,
      side: 'none',
      weight_kg: null,
      reps: null,
      duration_seconds: null,
      distance_meters: 400,
      intensity_type: null,
      intensity_value: null,
      is_done: true,
      recorded_at: '2026-11-17T18:00:00Z',
    };

    expect(formatSetText(setTime, 'time', false, 'es', 'kg')).toBe('45s(1)');
    expect(formatSetText(setDist, 'distance', false, 'es', 'kg')).toBe('400m');
  });
});

describe('groupWorkoutsByProgram (Criterio 1)', () => {
  it('criterio 1: Ana ve tras 3 entrenos su historial DIA 1 … DIA 3 con las series y notas', () => {
    const workouts: RawWorkout[] = [
      {
        id: 'w-1',
        performed_on: '2026-10-06',
        started_at: '2026-10-06T18:00:00Z',
        closed_at: '2026-10-06T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-1',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-1',
                set_number: 1,
                side: 'none',
                weight_kg: 45,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-06T18:03:00Z',
              },
              {
                id: 's-2',
                set_number: 2,
                side: 'none',
                weight_kg: 45,
                reps: 7,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-06T18:06:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-2',
        performed_on: '2026-10-13',
        started_at: '2026-10-13T18:00:00Z',
        closed_at: '2026-10-13T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-2',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: 'Mochila más ajustada',
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-3',
                set_number: 1,
                side: 'none',
                weight_kg: 47.5,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-13T18:03:00Z',
              },
              {
                id: 's-4',
                set_number: 2,
                side: 'none',
                weight_kg: 47.5,
                reps: 7,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-13T18:06:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-3',
        performed_on: '2026-10-20',
        started_at: '2026-10-20T18:00:00Z',
        closed_at: '2026-10-20T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-3',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-5',
                set_number: 1,
                side: 'none',
                weight_kg: 50,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-20T18:03:00Z',
              },
            ],
          },
        ],
      },
    ];

    const exMap = new Map([
      [
        'ex-flexiones',
        {
          id: 'ex-flexiones',
          name: 'Flexiones con mochila',
          measurement: 'weight_reps',
          isUnilateral: false,
        },
      ],
    ]);

    const groups = groupWorkoutsByProgram(workouts, exMap, 'prog-1', 'es', 'kg', (n) => `DIA ${n}`);

    expect(groups).toHaveLength(1);
    const group = groups[0]!;
    expect(group.programName).toBe('Casa + Gym');
    expect(group.isCurrent).toBe(true);

    const flexiones = group.exercises.find((e) => e.exerciseId === 'ex-flexiones');
    expect(flexiones).toBeDefined();
    expect(flexiones!.history).toHaveLength(3);

    // Comprobamos DIA 1 … DIA 3
    const h0 = flexiones!.history[0]!;
    expect(h0.label).toBe('DIA 1');
    expect(h0.fullText).toBe('DIA 1: 45×8(1) / 45×7(1)');
    expect(h0.hasNote).toBe(false);

    const h1 = flexiones!.history[1]!;
    expect(h1.label).toBe('DIA 2');
    expect(h1.fullText).toBe('DIA 2: 47.5×8(1) / 47.5×7(1)');
    expect(h1.hasNote).toBe(true);
    expect(h1.dayNote).toBe('Mochila más ajustada');

    const h2 = flexiones!.history[2]!;
    expect(h2.label).toBe('DIA 3');
    expect(h2.fullText).toBe('DIA 3: 50×8(1)');

    // Récords del ejercicio
    expect(flexiones!.records.maxWeightKg).toBe(50);
    // 50 × 8 (RIR 1) -> 50 * (1 + 9/30) = 50 * 1.3 = 65 kg
    expect(flexiones!.records.maxRm).toBe(65);
  });

  it('agrupa por rutina incluyendo rutinas anteriores', () => {
    const workouts: RawWorkout[] = [
      {
        id: 'w-old',
        performed_on: '2026-08-01',
        started_at: '2026-08-01T10:00:00Z',
        closed_at: null,
        day_number: 1,
        program_id: 'prog-old',
        programs: { id: 'prog-old', name: 'Rutina Antigua' },
        workout_exercises: [
          {
            id: 'we-old',
            exercise_id: 'ex-press',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-o1',
                set_number: 1,
                side: 'none',
                weight_kg: 30,
                reps: 10,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 2,
                is_done: true,
                recorded_at: '2026-08-01T10:05:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-curr',
        performed_on: '2026-10-01',
        started_at: '2026-10-01T10:00:00Z',
        closed_at: null,
        day_number: 1,
        program_id: 'prog-curr',
        programs: { id: 'prog-curr', name: 'Rutina Actual' },
        workout_exercises: [
          {
            id: 'we-c1',
            exercise_id: 'ex-press',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-c1',
                set_number: 1,
                side: 'none',
                weight_kg: 40,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-01T10:05:00Z',
              },
            ],
          },
        ],
      },
    ];

    const exMap = new Map([
      [
        'ex-press',
        { id: 'ex-press', name: 'Press militar', measurement: 'weight_reps', isUnilateral: false },
      ],
    ]);

    const groups = groupWorkoutsByProgram(
      workouts,
      exMap,
      'prog-curr',
      'es',
      'kg',
      (n) => `DIA ${n}`,
    );

    expect(groups).toHaveLength(2);
    // Rutina actual va primero
    const g0 = groups[0]!;
    expect(g0.programName).toBe('Rutina Actual');
    expect(g0.isCurrent).toBe(true);
    // Rutina antigua va segunda
    const g1 = groups[1]!;
    expect(g1.programName).toBe('Rutina Antigua');
    expect(g1.isCurrent).toBe(false);
  });
});
