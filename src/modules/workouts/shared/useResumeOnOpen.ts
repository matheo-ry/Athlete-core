import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { exerciseToResume } from '../model/active-workout';
import { isTimedOut } from '../model/workout-timers';

/**
 * Con un entreno abierto, al abrir la app se va directo al ejercicio que toca
 * (D-119). Solo una vez por arranque y solo desde el inicio del cliente: si
 * luego vuelve al inicio a propósito, se queda ahí.
 */
export function useResumeOnOpen(): void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = useActiveWorkout();
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current || !active.isSuccess) {
      return;
    }
    decided.current = true;
    const workout = active.data;
    // Pasadas las 12 horas se cierra solo (D-119): no se entra en él.
    if (
      workout === null ||
      pathname !== '/client' ||
      isTimedOut(workout.lastChangedAt, Date.now())
    ) {
      return;
    }
    const position = exerciseToResume(workout);
    void navigate(
      position === null ? '/client/workout' : `/client/workout?exercise=${String(position)}`,
      {
        replace: true,
      },
    );
  }, [active.isSuccess, active.data, pathname, navigate]);
}
