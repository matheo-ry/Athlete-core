import { useMemo } from 'react';

import { useLanguage } from '@/core/i18n';

import { toOption } from '../model/exercise-list';
import type { ExerciseOption } from '../model/exercise-list';
import { useExercises } from './useExercises';

/**
 * Los ejercicios del negocio, por identificador, para otros módulos (PR 2.9):
 * así una rutina enseña el nombre de cada ejercicio, también de los archivados.
 * Es la misma consulta que la lista de "Ejercicios": comparten la caché.
 */
export function useExerciseOptions() {
  const exercises = useExercises();
  const language = useLanguage();
  const byId = useMemo(
    () =>
      new Map<string, ExerciseOption>(
        (exercises.data ?? []).map((exercise) => [exercise.id, toOption(exercise, language)]),
      ),
    [exercises.data, language],
  );
  return { byId, isPending: exercises.isPending, isError: exercises.isError };
}
