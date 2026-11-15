import { useQuery } from '@tanstack/react-query';

import { isExerciseInUse } from './exercises-api';

/** Si un ejercicio está en alguna rutina (D-072). Vacío al crear uno nuevo. */
export function useExerciseInUse(exerciseId: string | null) {
  return useQuery({
    queryKey: ['exercises', 'inUse', exerciseId],
    queryFn: () => isExerciseInUse(exerciseId ?? ''),
    enabled: exerciseId !== null,
  });
}
