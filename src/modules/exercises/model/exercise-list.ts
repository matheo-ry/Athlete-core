import type { Language } from '@/core/i18n';

import type { Equipment, Exercise, MuscleGroup } from './exercise-schema';

// La lista de ejercicios del coach: pestañas, buscador y filtros (D-073).
// La búsqueda se hace en la app, sobre la lista ya cargada. Lógica pura.

export type ExerciseTab = 'active' | 'archived';
export type ExerciseOrigin = 'all' | 'own' | 'platform';

export interface ExerciseFilters {
  query: string;
  muscleGroup: MuscleGroup | 'all';
  equipment: Equipment | 'all';
  origin: ExerciseOrigin;
}

export const NO_FILTERS: ExerciseFilters = {
  query: '',
  muscleGroup: 'all',
  equipment: 'all',
  origin: 'all',
};

export interface ExerciseListItem extends Exercise {
  /** El nombre que se enseña, en el idioma de quien mira si es del catálogo. */
  displayName: string;
  /** Lo creó el coach: no viene del catálogo (D-089). */
  isOwn: boolean;
}

/** Sin mayúsculas ni tildes: "Jalón" se encuentra escribiendo "jalon". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * El nombre propio, si el coach se lo puso; si no, el del catálogo en el
 * idioma de quien mira (D-071).
 */
export function exerciseName(exercise: Exercise, language: Language): string {
  return exercise.name ?? exercise.libraryName?.[language] ?? '';
}

/** El ejercicio con su nombre a la vista y si es propio. */
export function toListItem(exercise: Exercise, language: Language): ExerciseListItem {
  return {
    ...exercise,
    displayName: exerciseName(exercise, language),
    isOwn: exercise.libraryKey === null,
  };
}

/**
 * Lo que otros módulos saben de un ejercicio (las rutinas, PR 2.9): su nombre
 * a la vista, cómo se mide y si está archivado.
 */
export interface ExerciseOption {
  id: string;
  name: string;
  measurement: Exercise['measurement'];
  isUnilateral: boolean;
  isArchived: boolean;
}

export function toOption(exercise: Exercise, language: Language): ExerciseOption {
  return {
    id: exercise.id,
    name: exerciseName(exercise, language),
    measurement: exercise.measurement,
    isUnilateral: exercise.isUnilateral,
    isArchived: exercise.archivedAt !== null,
  };
}

function tabOf(exercise: Exercise): ExerciseTab {
  return exercise.archivedAt === null ? 'active' : 'archived';
}

/** Cuántos hay en cada pestaña, sin contar la búsqueda ni los filtros. */
export function countByTab(exercises: readonly Exercise[]): Record<ExerciseTab, number> {
  const archived = exercises.filter((exercise) => tabOf(exercise) === 'archived').length;
  return { active: exercises.length - archived, archived };
}

function matchesOrigin(item: ExerciseListItem, origin: ExerciseOrigin): boolean {
  return origin === 'all' || item.isOwn === (origin === 'own');
}

/**
 * Los ejercicios de una pestaña que cumplen la búsqueda y todos los filtros a
 * la vez, por orden alfabético en el idioma de la app.
 */
export function visibleExercises(
  exercises: readonly Exercise[],
  tab: ExerciseTab,
  filters: ExerciseFilters,
  language: Language,
): ExerciseListItem[] {
  const search = fold(filters.query);
  const collator = new Intl.Collator(language, { sensitivity: 'base' });
  return exercises
    .filter((exercise) => tabOf(exercise) === tab)
    .map((exercise) => toListItem(exercise, language))
    .filter((item) => search === '' || fold(item.displayName).includes(search))
    .filter((item) => filters.muscleGroup === 'all' || item.muscleGroup === filters.muscleGroup)
    .filter((item) => filters.equipment === 'all' || item.equipment === filters.equipment)
    .filter((item) => matchesOrigin(item, filters.origin))
    .sort((a, b) => collator.compare(a.displayName, b.displayName));
}
