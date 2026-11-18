import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cancelLocalNotification, onAppResume, scheduleLocalNotification } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { useActiveWorkout, useSaveActiveWorkout } from '../api/useActiveWorkout';
import { useSetTimedOutNotice } from '../api/useTimedOutNotice';
import { finishWorkout, setCounts } from '../model/active-workout';
import { isTimedOut, reminderAt, reminderId, timeoutDelay } from '../model/workout-timers';

/** Lo que le pasa al entreno abierto sin que nadie lo toque (D-119, D-150). */
export function useWorkoutLifecycle(): void {
  useReminder();
  useCloseWhenAbandoned();
}

/** El recordatorio de las 6 horas: cada cambio lo vuelve a programar. */
function useReminder(): void {
  const { t } = useTranslation();
  const { tenant } = useTenancy();
  const workout = useActiveWorkout().data ?? null;
  const tenantId = tenant?.id ?? null;

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    const id = reminderId(tenantId);
    const at = workout === null ? null : reminderAt(workout, Date.now());
    if (at === null) {
      void cancelLocalNotification(id);
      return;
    }
    void scheduleLocalNotification({
      id,
      title: t('workouts.reminder.title'),
      body: t('workouts.reminder.body'),
      at,
    });
  }, [tenantId, workout, t]);
}

/** A las 12 horas sin tocarlo se cierra solo, también si la app sigue abierta. */
function useCloseWhenAbandoned(): void {
  const workout = useActiveWorkout().data ?? null;
  const { mutate: save } = useSaveActiveWorkout();
  const { mutate: setNotice } = useSetTimedOutNotice();
  const closing = useRef<string | null>(null);

  useEffect(() => {
    if (workout === null) {
      return undefined;
    }
    const check = () => {
      const now = Date.now();
      if (closing.current === workout.id || !isTimedOut(workout.lastChangedAt, now)) {
        return;
      }
      closing.current = workout.id;
      save(finishWorkout(workout, new Date(now).toISOString(), 'timeout'));
      if (setCounts(workout.exercises).done > 0) {
        setNotice(workout.lastChangedAt);
      }
    };
    check();
    const timer = setTimeout(check, timeoutDelay(workout.lastChangedAt, Date.now()));
    const stopResume = onAppResume(check);
    return () => {
      clearTimeout(timer);
      stopResume();
    };
  }, [workout, save, setNotice]);
}
