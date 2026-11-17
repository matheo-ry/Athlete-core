import { useTenancy } from '@/core/tenancy';
import { useExerciseOptions } from '@/modules/exercises';
import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { startWorkout } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { useActiveWorkout, useSaveActiveWorkout } from './useActiveWorkout';

/**
 * Empieza el entreno de un día (D-119). Si ya hay uno abierto, no empieza
 * otro: devuelve el abierto (un solo entreno a la vez; se cierra en el PR 3.6).
 */
export function useStartWorkout() {
  const { tenant } = useTenancy();
  const active = useActiveWorkout();
  const save = useSaveActiveWorkout();
  const options = useExerciseOptions();

  const start = async (
    programId: string,
    block: ProgramBlock,
    day: ProgramDay,
  ): Promise<ActiveWorkout | null> => {
    if (tenant === null) {
      return null;
    }
    if (active.data) {
      return active.data;
    }
    const workout = startWorkout({
      tenantId: tenant.id,
      programId,
      block,
      day,
      exerciseInfo: (exerciseId) => {
        const option = options.byId.get(exerciseId);
        return {
          measurement: option?.measurement ?? 'weight_reps',
          isUnilateral: option?.isUnilateral ?? false,
        };
      },
      now: new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    });
    await save.mutateAsync(workout);
    return workout;
  };

  return { start, isReady: active.isSuccess && !options.isPending, isPending: save.isPending };
}
