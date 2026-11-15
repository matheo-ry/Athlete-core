import { describe, expect, it } from 'vitest';

import { parseExercises } from './exercise-schema';

const ROW = {
  id: '00000000-0000-4000-8000-000000000001',
  name: null,
  library_key: 'lat_pulldown',
  muscle_group: 'back',
  equipment: 'cable',
  measurement: 'weight_reps',
  is_unilateral: false,
  archived_at: null,
  exercise_library: { name_en: 'Lat pulldown', name_es: 'Jalón al pecho' },
};

describe('parseExercises', () => {
  it('convierte una fila del catálogo, con su nombre en los dos idiomas', () => {
    expect(parseExercises([ROW])).toEqual([
      {
        id: ROW.id,
        name: null,
        libraryKey: 'lat_pulldown',
        libraryName: { en: 'Lat pulldown', es: 'Jalón al pecho' },
        muscleGroup: 'back',
        equipment: 'cable',
        measurement: 'weight_reps',
        isUnilateral: false,
        archivedAt: null,
      },
    ]);
  });

  it('acepta uno propio, sin catálogo, grupo ni material', () => {
    const [exercise] = parseExercises([
      {
        ...ROW,
        name: 'Remo Gironda',
        library_key: null,
        muscle_group: null,
        equipment: null,
        exercise_library: null,
      },
    ]);
    expect(exercise?.libraryName).toBeNull();
    expect(exercise?.name).toBe('Remo Gironda');
  });

  it('rechaza un valor fuera de las listas cerradas (D-072)', () => {
    expect(() => parseExercises([{ ...ROW, muscle_group: 'neck' }])).toThrow();
    expect(() => parseExercises([{ ...ROW, measurement: 'calories' }])).toThrow();
  });
});
