import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { finishWorkout, setCounts } from '../model/active-workout';
import type { ActiveWorkout, CloseReason } from '../model/active-workout';
import { autoCloseDelay } from '../model/close-workout';

/**
 * Cierra el entreno y va a su resumen final (D-119). Sin ninguna serie hecha
 * no se guarda: vuelve al inicio.
 */
export function useCloseWorkout() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useSaveActiveWorkout();

  const close = useCallback(
    async (workout: ActiveWorkout, reason: CloseReason) => {
      const closed = finishWorkout(workout, new Date().toISOString(), reason);
      await mutateAsync(closed);
      await navigate(
        setCounts(closed.exercises).done > 0 ? `/client/workout?finished=${closed.id}` : '/client',
        { replace: true },
      );
    },
    [mutateAsync, navigate],
  );

  return { close, isPending };
}

/**
 * Con todas las series hechas, el entreno se cierra solo (D-119, D-149): en
 * el resumen, enseguida; en un ejercicio, pasados unos segundos sin cambios.
 */
export function useAutoClose(workout: ActiveWorkout, onSummary: boolean): void {
  const { close } = useCloseWorkout();

  useEffect(() => {
    const delay = autoCloseDelay(workout, Date.now(), onSummary);
    if (delay === null) {
      return undefined;
    }
    const timer = setTimeout(() => void close(workout, 'completed'), delay);
    return () => {
      clearTimeout(timer);
    };
  }, [workout, onSummary, close]);
}
