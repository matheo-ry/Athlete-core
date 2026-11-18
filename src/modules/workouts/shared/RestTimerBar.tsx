import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { ringRestAlarm } from '../api/rest-alarm';
import { restTimerStore, useRestTimer } from '../api/rest-timer-store';
import {
  REST_ADJUST_SECONDS,
  REST_SHORTCUTS,
  formatClock,
  isPaused,
  remainingMs,
} from '../model/rest-timer';

/** Si el descanso acabó hace más que esto, no se avisa dentro de la app: ya sonó la notificación. */
const LIVE_ALARM_WINDOW_MS = 2000;

/**
 * La barra del descanso (D-123): fija y a la vista mientras se apunta, en
 * cualquier pantalla del entreno. Tiempo que queda, pausar, parar, saltar,
 * ±15 s y los atajos. Se monta como servicio del módulo.
 */
export function RestTimerBar() {
  const { t } = useTranslation();
  const timer = useRestTimer();
  const workout = useActiveWorkout().data ?? null;
  const profile = useProfile().data;
  const [now, setNow] = useState(() => Date.now());
  const rang = useRef<number | null>(null);

  const belongsHere = timer !== null && workout !== null && workout.id === timer.workoutId;
  // Sin entreno abierto (o con otro) no hay descanso que enseñar ni avisar.
  useEffect(() => {
    if (timer !== null && !belongsHere) {
      restTimerStore.stop();
    }
  }, [timer, belongsHere]);

  useEffect(() => {
    if (!belongsHere) {
      return;
    }
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(id);
    };
  }, [belongsHere]);

  const endsAt = timer?.endsAtMs ?? null;
  const left = timer === null ? 0 : remainingMs(timer, now);
  const finished = belongsHere && endsAt !== null && left === 0;

  useEffect(() => {
    if (!finished || endsAt === null || rang.current === endsAt) {
      return;
    }
    rang.current = endsAt;
    if (Date.now() - endsAt < LIVE_ALARM_WINDOW_MS) {
      ringRestAlarm({
        sound: profile?.restSound ?? true,
        vibration: profile?.restVibration ?? true,
      });
    }
  }, [finished, endsAt, profile?.restSound, profile?.restVibration]);

  if (!belongsHere) {
    return null;
  }
  const paused = isPaused(timer);
  const button =
    'border-border bg-surface min-h-11 min-w-11 rounded-lg border px-3 text-sm font-semibold';

  return (
    <section
      aria-label={t('workouts.rest.label')}
      className="bg-surface border-border fixed inset-x-2 bottom-[calc(5rem+var(--safe-bottom))] z-40 mx-auto flex max-w-lg flex-col gap-2 rounded-lg border p-3 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <p
          role="timer"
          aria-live={finished ? 'assertive' : 'off'}
          className="text-2xl font-bold tabular-nums"
        >
          {finished ? t('workouts.rest.done') : formatClock(left)}
        </p>
        <div className="flex gap-2">
          {finished ? null : (
            <button
              type="button"
              className={button}
              onClick={() => {
                if (paused) {
                  restTimerStore.resume();
                } else {
                  restTimerStore.pause();
                }
              }}
            >
              {paused ? t('workouts.rest.resume') : t('workouts.rest.pause')}
            </button>
          )}
          {/* Parar y saltar son lo mismo: se acaba el descanso y no suena nada (D-3.7-1). */}
          <button
            type="button"
            className={button}
            onClick={() => {
              restTimerStore.stop();
            }}
          >
            {finished ? t('workouts.rest.close') : t('workouts.rest.skip')}
          </button>
        </div>
      </div>
      {finished ? null : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            aria-label={t('workouts.rest.minus', { seconds: REST_ADJUST_SECONDS })}
            onClick={() => {
              restTimerStore.adjust(-REST_ADJUST_SECONDS);
            }}
          >
            −{REST_ADJUST_SECONDS} s
          </button>
          <button
            type="button"
            className={button}
            aria-label={t('workouts.rest.plus', { seconds: REST_ADJUST_SECONDS })}
            onClick={() => {
              restTimerStore.adjust(REST_ADJUST_SECONDS);
            }}
          >
            +{REST_ADJUST_SECONDS} s
          </button>
          {REST_SHORTCUTS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={button}
              onClick={() => {
                restTimerStore.preset(seconds);
              }}
            >
              {formatClock(seconds * 1000)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
