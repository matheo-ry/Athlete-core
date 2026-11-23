import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { useProfile } from '@/core/auth';
import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

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

const CHIP =
  'focus-ring numeric bg-foreground/6 hover:bg-foreground/12 min-h-11 rounded-full px-1 text-xs ' +
  'font-medium transition-[background-color,transform] active:scale-95';

const ROUND =
  'focus-ring flex size-12 shrink-0 items-center justify-center rounded-full ' +
  'transition-[transform,background-color] active:scale-90';

/**
 * La barra del descanso (D-123): flota sobre la navegación mientras se apunta,
 * en cualquier pantalla del entreno. La cuenta atrás grande, una barra que se
 * vacía, pausar, saltar, ±15 s y los atajos. Se monta como servicio del módulo.
 */
export function RestTimerBar() {
  const { t } = useTranslation();
  const timer = useRestTimer();
  // En la pantalla del entreno no hay barra de navegación: la del descanso baja.
  const isTraining = useLocation().pathname.startsWith('/client/workout');
  const workout = useActiveWorkout().data ?? null;
  const profile = useProfile().data;
  const [now, setNow] = useState(() => Date.now());
  // El tiempo más largo visto en este descanso: la referencia de la barra.
  const [peakMs, setPeakMs] = useState(0);
  const rang = useRef<number | null>(null);
  const bar = useRef<HTMLElement | null>(null);

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

  // La barra va por encima del contenido: se deja sitio debajo para que no tape
  // ningún botón (ni se pueda tocar nada a su través).
  useEffect(() => {
    const element = bar.current;
    if (!belongsHere || element === null) {
      return;
    }
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${String(element.offsetHeight + 16)}px`;
    return () => {
      document.body.style.paddingBottom = previous;
    };
  });

  const endsAt = timer?.endsAtMs ?? null;
  const left = timer === null ? 0 : remainingMs(timer, now);
  const finished = belongsHere && endsAt !== null && left === 0;
  // Se ajusta mientras se pinta (patrón de React para derivar de lo anterior).
  const nextPeak = belongsHere ? Math.max(peakMs, left) : 0;
  if (nextPeak !== peakMs) {
    setPeakMs(nextPeak);
  }

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
  const fraction = nextPeak === 0 ? 0 : left / nextPeak;

  return (
    <section
      ref={bar}
      aria-label={t('workouts.rest.label')}
      className={cn(
        'glass animate-rise fixed inset-x-3 z-40 mx-auto flex max-w-md flex-col gap-3 rounded-3xl p-3',
        isTraining
          ? 'bottom-[calc(0.75rem+var(--safe-bottom))]'
          : 'bottom-[calc(5.5rem+var(--safe-bottom))]',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pl-1">
          <p className="eyebrow flex items-center gap-1.5">
            <Icon name="timer" className="size-3.5" />
            {t('workouts.rest.label')}
          </p>
          <p
            role="timer"
            aria-live={finished ? 'assertive' : 'off'}
            className={cn(
              'numeric leading-none font-medium',
              finished ? 'text-primary-readable text-2xl' : 'text-4xl',
              paused && 'text-muted',
            )}
          >
            {finished ? t('workouts.rest.done') : formatClock(left)}
          </p>
        </div>
        {finished ? null : (
          <button
            type="button"
            aria-label={paused ? t('workouts.rest.resume') : t('workouts.rest.pause')}
            className={cn(ROUND, 'surface-raised')}
            onClick={() => {
              if (paused) {
                restTimerStore.resume();
              } else {
                restTimerStore.pause();
              }
            }}
          >
            <Icon name={paused ? 'play' : 'pause'} className="size-5" />
          </button>
        )}
        {/* Parar y saltar son lo mismo: se acaba el descanso y no suena nada (D-3.7-1). */}
        <button
          type="button"
          aria-label={finished ? t('workouts.rest.close') : t('workouts.rest.skip')}
          className={cn(
            ROUND,
            'bg-primary text-on-primary shadow-[0_8px_22px_-8px_var(--color-primary-glow)]',
          )}
          onClick={() => {
            restTimerStore.stop();
          }}
        >
          <Icon name={finished ? 'check' : 'skip'} className="size-5" />
        </button>
      </div>
      {finished ? null : (
        <>
          <div aria-hidden="true" className="bg-foreground/10 h-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300 ease-linear"
              style={{ width: `${String(fraction * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            <button
              type="button"
              className={CHIP}
              aria-label={t('workouts.rest.minus', { seconds: REST_ADJUST_SECONDS })}
              onClick={() => {
                restTimerStore.adjust(-REST_ADJUST_SECONDS);
              }}
            >
              −{REST_ADJUST_SECONDS}
            </button>
            <button
              type="button"
              className={CHIP}
              aria-label={t('workouts.rest.plus', { seconds: REST_ADJUST_SECONDS })}
              onClick={() => {
                restTimerStore.adjust(REST_ADJUST_SECONDS);
              }}
            >
              +{REST_ADJUST_SECONDS}
            </button>
            {REST_SHORTCUTS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={CHIP}
                onClick={() => {
                  restTimerStore.preset(seconds);
                }}
              >
                {formatClock(seconds * 1000)}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
