import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { exerciseToResume } from '../model/active-workout';

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
    if (workout === null || pathname !== '/client') {
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
