import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { useTenancy } from '@/core/tenancy';

import type { ExerciseInput } from '../model/exercise-form';
import type { Exercise } from '../model/exercise-schema';
import { createExercise, setExerciseArchived, updateExercise } from './exercises-api';
import type { SaveExerciseResult } from './exercises-api';
import { exercisesQueryKey } from './useExercises';

export type SaveResult = SaveExerciseResult | { status: 'offline' };

/** Guardar los datos (`id` vacío = ejercicio nuevo), o archivar y recuperar. */
type SaveVariables =
  { id: string | null; input: ExerciseInput } | { id: string; archived: boolean };

/**
 * Crear, cambiar, archivar o recuperar un ejercicio (D-061: sin conexión no
 * se intenta). "Restaurar original" y "Duplicar" también pasan por aquí. La fila
 * que devuelve la base de datos sustituye a la de la lista, sin volver a
 * pedirla entera.
 */
export function useSaveExercise() {
  const { tenant } = useTenancy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation<SaveResult, Error, SaveVariables>({
    mutationFn: async (variables) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      if ('archived' in variables) {
        return setExerciseArchived(variables.id, variables.archived);
      }
      const { id, input } = variables;
      if (id !== null) {
        return updateExercise(id, input);
      }
      if (tenantId === null || user === null) {
        return { status: 'error' };
      }
      return createExercise(tenantId, user.id, input);
    },
    onSuccess: (result) => {
      if (result.status !== 'saved') {
        return;
      }
      queryClient.setQueryData<Exercise[]>(exercisesQueryKey(tenantId), (list = []) => {
        const others = list.filter((item) => item.id !== result.exercise.id);
        return [...others, result.exercise];
      });
    },
  });
}
