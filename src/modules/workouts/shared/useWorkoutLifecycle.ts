import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { logger } from '@/core/lib';
import {
  cancelLocalNotification,
  getUploadQueue,
  onAppResume,
  scheduleLocalNotification,
  useUploadQueue,
} from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { isWorkoutOpen } from '../api/remote-workout-api';
import {
  useActiveWorkout,
  useForgetActiveWorkout,
  useSaveActiveWorkout,
} from '../api/useActiveWorkout';
import { useSetTimedOutNotice } from '../api/useTimedOutNotice';
import {
  useKnownOpenWorkoutIds,
  useRefreshOpenWorkouts,
  useWorkoutOwnership,
} from '../api/useWorkoutOwnership';
import { finishWorkout, setCounts } from '../model/active-workout';
import { isTimedOut, reminderAt, reminderId, timeoutDelay } from '../model/workout-timers';

/** Margen para que lo recién empezado llegue a la cola antes de mirar la nube. */
const SETTLE_MS = 60_000;

/** Lo que le pasa al entreno abierto sin que nadie lo toque (D-119, D-124, D-151, D-152). */
export function useWorkoutLifecycle(userId: string): void {
  useReminder();
  useCloseWhenAbandoned();
  useForgetWhenEndedElsewhere(userId);
  const refresh = useRefreshOpenWorkouts();
  useEffect(() => onAppResume(refresh), [refresh]);
}

/** El recordatorio de las 6 horas: cada cambio lo vuelve a programar. */
function useReminder(): void {
  const { t } = useTranslation();
  const { tenant } = useTenancy();
  const workout = useActiveWorkout().data ?? null;
  const taken = useWorkoutOwnership().kind === 'taken';
  const tenantId = tenant?.id ?? null;

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    const id = reminderId(tenantId);
    const at = workout === null || taken ? null : reminderAt(workout, Date.now());
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
  }, [tenantId, workout, taken, t]);
}

/** A las 12 horas sin tocarlo se cierra solo, también si la app sigue abierta. */
function useCloseWhenAbandoned(): void {
  const workout = useActiveWorkout().data ?? null;
  const taken = useWorkoutOwnership().kind === 'taken';
  const { mutate: save } = useSaveActiveWorkout();
  const { mutate: setNotice } = useSetTimedOutNotice();
  const closing = useRef<string | null>(null);

  useEffect(() => {
    // Si lo tiene otro móvil, cerrarlo no le toca a este.
    if (workout === null || taken) {
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
  }, [workout, taken, save, setNotice]);
}

/**
 * Si otro móvil lo cerró o lo descartó, aquí sobra. Solo con la cola ya vacía
 * y preguntando a la nube después: un entreno que aún no ha subido tampoco
 * está allí, y no hay que confundirlo.
 */
function useForgetWhenEndedElsewhere(userId: string): void {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;
  const workout = useActiveWorkout().data ?? null;
  const openIds = useKnownOpenWorkoutIds();
  const queue = useUploadQueue(userId);
  const { mutate: forget } = useForgetActiveWorkout();
  const workoutId = workout?.id ?? null;
  const lastChangedAt = workout?.lastChangedAt ?? null;
  const isOpenThere = workoutId !== null && openIds?.has(workoutId) === true;
  const known = openIds !== null;
  const queued = queue.some((item) => item.id === workoutId);

  useEffect(() => {
    if (
      workoutId === null ||
      lastChangedAt === null ||
      tenantId === null ||
      !known ||
      isOpenThere ||
      queued ||
      !navigator.onLine ||
      Date.now() - Date.parse(lastChangedAt) < SETTLE_MS
    ) {
      return undefined;
    }
    let current = true;
    const confirm = async () => {
      const items = await getUploadQueue().list(userId);
      if (items.some((item) => item.id === workoutId)) {
        return;
      }
      if (current && !(await isWorkoutOpen(tenantId, workoutId)) && current) {
        forget();
      }
    };
    confirm().catch((error: unknown) => {
      // Se vuelve a mirar al volver a la app.
      logger.warn('Could not check the open workout', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
    return () => {
      current = false;
    };
  }, [workoutId, lastChangedAt, tenantId, known, isOpenThere, queued, userId, forget]);
}
