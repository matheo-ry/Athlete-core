import { describe, expect, it } from 'vitest';

import { NO_FILTERS, countByTab, exerciseName, visibleExercises } from './exercise-list';
import type { ExerciseFilters } from './exercise-list';
import type { Exercise } from './exercise-schema';

let nextId = 0;

function fromLibrary(en: string, es: string, overrides: Partial<Exercise> = {}): Exercise {
  nextId += 1;
  return {
    id: String(nextId),
    name: null,
    libraryKey: `key_${nextId}`,
    libraryName: { en, es },
    muscleGroup: 'back',
    equipment: 'cable',
    measurement: 'weight_reps',
    isUnilateral: false,
    instructions: null,
    videoUrl: null,
    archivedAt: null,
    ...overrides,
  };
}

function own(name: string, overrides: Partial<Exercise> = {}): Exercise {
  return fromLibrary('', '', { name, libraryKey: null, libraryName: null, ...overrides });
}

const PULLDOWN = fromLibrary('Lat pulldown', 'Jalón al pecho');
// Un ejercicio del catálogo al que el coach cambió el nombre.
const RENAMED = fromLibrary('Dumbbell row', 'Remo con mancuerna', { name: 'Remo a una mano' });

const EXERCISES = [
  PULLDOWN,
  fromLibrary('Close-grip lat pulldown', 'Jalón con agarre estrecho'),
  fromLibrary('Machine chest press', 'Press de pecho en máquina', {
    muscleGroup: 'chest',
    equipment: 'machine',
  }),
  fromLibrary('Pec deck fly', 'Aperturas en máquina (pec deck)', {
    muscleGroup: 'chest',
    equipment: 'machine',
  }),
  fromLibrary('Push-up', 'Flexiones', { muscleGroup: 'chest', equipment: 'bodyweight' }),
  RENAMED,
  own('Remo Gironda agarre amplio'),
  own('Sentadilla búlgara', { muscleGroup: null, equipment: null }),
  fromLibrary('Burpee', 'Burpees', { archivedAt: '2026-11-15T10:00:00Z' }),
];

function names(filters: Partial<ExerciseFilters>, language: 'en' | 'es' = 'es', tab = 'active') {
  return visibleExercises(
    EXERCISES,
    tab === 'active' ? 'active' : 'archived',
    { ...NO_FILTERS, ...filters },
    language,
  ).map((item) => item.displayName);
}

describe('exerciseName (D-071)', () => {
  it('uno del catálogo sin cambiar se ve en el idioma de quien mira', () => {
    expect(exerciseName(PULLDOWN, 'en')).toBe('Lat pulldown');
    expect(exerciseName(PULLDOWN, 'es')).toBe('Jalón al pecho');
  });

  it('si el coach le puso nombre, se ve ese en los dos idiomas', () => {
    expect(exerciseName(RENAMED, 'en')).toBe('Remo a una mano');
    expect(exerciseName(RENAMED, 'es')).toBe('Remo a una mano');
  });
});

describe('visibleExercises (D-073)', () => {
  it('los activos, por orden alfabético en el idioma de la app', () => {
    expect(names({}, 'en')).toEqual([
      'Close-grip lat pulldown',
      'Lat pulldown',
      'Machine chest press',
      'Pec deck fly',
      'Push-up',
      'Remo a una mano',
      'Remo Gironda agarre amplio',
      'Sentadilla búlgara',
    ]);
    expect(names({}, 'es').slice(0, 3)).toEqual([
      'Aperturas en máquina (pec deck)',
      'Flexiones',
      'Jalón al pecho',
    ]);
  });

  it('marca como propios los que no vienen del catálogo', () => {
    const items = visibleExercises(EXERCISES, 'active', NO_FILTERS, 'es');
    expect(items.filter((item) => item.isOwn).map((item) => item.displayName)).toEqual([
      'Remo Gironda agarre amplio',
      'Sentadilla búlgara',
    ]);
  });

  it('busca por el nombre que se ve, sin importar tildes ni mayúsculas', () => {
    expect(names({ query: 'jalon' })).toEqual(['Jalón al pecho', 'Jalón con agarre estrecho']);
    expect(names({ query: '  BULGARA ' })).toEqual(['Sentadilla búlgara']);
    expect(names({ query: 'pulldown' }, 'en')).toHaveLength(2);
    // En español, el nombre en inglés no cuenta.
    expect(names({ query: 'pulldown' }, 'es')).toEqual([]);
    expect(names({ query: 'zzzz' })).toEqual([]);
  });

  it('filtra por grupo, material y origen, combinados entre sí y con la búsqueda', () => {
    expect(names({ muscleGroup: 'chest' })).toHaveLength(3);
    expect(names({ muscleGroup: 'chest', equipment: 'machine' })).toEqual([
      'Aperturas en máquina (pec deck)',
      'Press de pecho en máquina',
    ]);
    expect(names({ muscleGroup: 'chest', equipment: 'machine', query: 'press' })).toEqual([
      'Press de pecho en máquina',
    ]);
    expect(names({ origin: 'own' })).toEqual(['Remo Gironda agarre amplio', 'Sentadilla búlgara']);
    expect(names({ origin: 'platform', query: 'remo' })).toEqual(['Remo a una mano']);
  });

  it('un ejercicio sin grupo ni material solo sale sin esos filtros', () => {
    expect(names({ query: 'bulgara', muscleGroup: 'quads' })).toEqual([]);
    expect(names({ query: 'bulgara', equipment: 'other' })).toEqual([]);
  });

  it('los archivados van en su pestaña, con los mismos filtros', () => {
    expect(names({}, 'es', 'archived')).toEqual(['Burpees']);
    expect(names({ query: 'burpee' })).toEqual([]);
  });
});

describe('countByTab', () => {
  it('cuenta cada pestaña sin mirar la búsqueda ni los filtros', () => {
    expect(countByTab(EXERCISES)).toEqual({ active: 8, archived: 1 });
    expect(countByTab([])).toEqual({ active: 0, archived: 0 });
  });
});
