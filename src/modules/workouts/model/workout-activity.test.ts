import { describe, expect, it } from 'vitest';

import {
  countNotes,
  countRecords,
  countReplacements,
  getOpenedWorkoutIds,
  markWorkoutOpened,
} from './workout-activity';
import type { WorkoutActivityRecord } from './workout-activity';

describe('countRecords', () => {
  const previousWorkout: WorkoutActivityRecord = {
    id: 'w-1',
    clientId: 'client-1',
    performedOn: '2026-11-01',
    dayNumber: 1,
    dayName: 'Lunes',
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'ex-bench',
        replacesExerciseId: null,
        dayNote: null,
        isSkipped: false,
        sets: [
          {
            setNumber: 1,
            weightKg: 80,
            reps: 8,
            intensityType: 'rir',
            intensityValue: 2,
            isDone: true,
          },
        ],
      },
      {
        id: 'we-2',
        exerciseId: 'ex-squat',
        replacesExerciseId: null,
        dayNote: null,
        isSkipped: false,
        sets: [
          {
            setNumber: 1,
            weightKg: 100,
            reps: 5,
            intensityType: 'rir',
            intensityValue: 1,
            isDone: true,
          },
        ],
      },
    ],
  };

  it('cuenta récord si supera el peso máximo de la vez anterior', () => {
    const currentWorkout: WorkoutActivityRecord = {
      id: 'w-2',
      clientId: 'client-1',
      performedOn: '2026-11-08',
      dayNumber: 1,
      dayName: 'Lunes',
      exercises: [
        {
          id: 'we-3',
          exerciseId: 'ex-bench',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 85,
              reps: 8,
              intensityType: 'rir',
              intensityValue: 2,
              isDone: true,
            },
          ],
        },
      ],
    };

    expect(countRecords(currentWorkout, [previousWorkout])).toBe(1);
  });

  it('cuenta récord si supera el RM estimado aunque el peso sea igual', () => {
    const currentWorkout: WorkoutActivityRecord = {
      id: 'w-2',
      clientId: 'client-1',
      performedOn: '2026-11-08',
      dayNumber: 1,
      dayName: 'Lunes',
      exercises: [
        {
          id: 'we-3',
          exerciseId: 'ex-bench',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 80,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
      ],
    };

    expect(countRecords(currentWorkout, [previousWorkout])).toBe(1);
  });

  it('no cuenta récord si es la primera vez que se hace el ejercicio', () => {
    const currentWorkout: WorkoutActivityRecord = {
      id: 'w-2',
      clientId: 'client-1',
      performedOn: '2026-11-08',
      dayNumber: 1,
      dayName: 'Lunes',
      exercises: [
        {
          id: 'we-3',
          exerciseId: 'ex-new',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 50,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
      ],
    };

    expect(countRecords(currentWorkout, [previousWorkout])).toBe(0);
  });
});

describe('countReplacements y countNotes', () => {
  const workout: WorkoutActivityRecord = {
    id: 'w-1',
    clientId: 'client-1',
    performedOn: '2026-11-01',
    dayNumber: 1,
    dayName: 'Lunes',
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'ex-1',
        replacesExerciseId: 'ex-orig-1',
        dayNote: 'Molestia leve',
        isSkipped: false,
        sets: [],
      },
      {
        id: 'we-2',
        exerciseId: 'ex-2',
        replacesExerciseId: null,
        dayNote: '  ',
        isSkipped: false,
        sets: [],
      },
    ],
  };

  it('cuenta ejercicios cambiados', () => {
    expect(countReplacements(workout)).toBe(1);
  });

  it('cuenta notas del día no vacías', () => {
    expect(countNotes(workout)).toBe(1);
  });
});

describe('gestión de entrenos abiertos', () => {
  it('guarda y recupera los identificadores abiertos', () => {
    const fakeStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => fakeStore[key] ?? null,
      setItem: (key: string, val: string) => {
        fakeStore[key] = val;
      },
    };

    expect(getOpenedWorkoutIds(mockStorage).size).toBe(0);
    markWorkoutOpened('workout-abc', mockStorage);
    expect(getOpenedWorkoutIds(mockStorage).has('workout-abc')).toBe(true);
  });
});
