import { ChevronRight, Pause, Play, SkipForward, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { useProfile } from '@/core/auth';
import { cn } from '@/core/lib';
import { ProgressRing } from '@/core/ui';

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

const CONTROL =
  'focus-ring flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap ' +
  'bg-glass-strong shadow-[var(--glass-edge)] transition-[background-color,transform] duration-150 ' +
  'hover:bg-glass-hover active:scale-95';

/**
 * La barra del descanso (D-123): fija y a la vista mientras se apunta, en
 * cualquier pantalla del entreno. Tiempo que queda, pausar, parar, saltar,
 * ±15 s y los atajos. Se monta como servicio del módulo. Fuera del entreno
 * (D-prime2-6) se encoge a una píldora encima de la barra de navegación que
 * lleva de vuelta; el aviso al acabar suena igual.
 */
export function RestTimerBar() {
  const { t } = useTranslation();
  const timer = useRestTimer();
  const workout = useActiveWorkout().data ?? null;
  const profile = useProfile().data;
  const [now, setNow] = useState(() => Date.now());
  const rang = useRef<number | null>(null);
  const bar = useRef<HTMLElement | null>(null);
  // Lo máximo que ha quedado en este descanso: el anillo se vacía desde ahí.
  const [peak, setPeak] = useState(0);
  const { pathname } = useLocation();
  const compact = !pathname.startsWith('/client/workout');

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
    if (!belongsHere || compact || element === null) {
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
  const nextPeak = timer === null || finished ? 0 : Math.max(peak, left);
  if (nextPeak !== peak) {
    // Se guarda al pintar (patrón de React para lo que depende de lo anterior).
    setPeak(nextPeak);
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
  const clock = finished ? t('workouts.rest.done') : formatClock(left);

  if (compact) {
    return (
      <Link
        to="/client/workout"
        aria-label={t('workouts.rest.label')}
        className="glass-float focus-ring fixed inset-x-0 bottom-[calc(6.25rem+var(--safe-bottom))] z-40 mx-auto flex w-fit items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5"
      >
        <ProgressRing value={left} max={nextPeak || 1} size={36} stroke={3.5} />
        <span role="timer" className="numeral text-lg">
          {clock}
        </span>
        <ChevronRight aria-hidden="true" className="text-muted size-4" />
      </Link>
    );
  }

  return (
    <section
      ref={bar}
      aria-label={t('workouts.rest.label')}
      className="glass-float animate-enter fixed inset-x-3 bottom-[calc(0.75rem+var(--safe-bottom))] z-40 mx-auto flex max-w-lg flex-col gap-3 rounded-[2rem] p-3 pl-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProgressRing value={left} max={nextPeak || 1} size={52} stroke={4.5}>
            {paused ? <Pause aria-hidden="true" className="text-muted size-4" /> : null}
          </ProgressRing>
          <p
            role="timer"
            aria-live={finished ? 'assertive' : 'off'}
            className={cn('numeral', finished ? 'text-primary-readable text-2xl' : 'text-[2.5rem]')}
          >
            {clock}
          </p>
        </div>
        <div className="flex gap-2">
          {finished ? null : (
            <button
              type="button"
              className={CONTROL}
              onClick={() => {
                if (paused) {
                  restTimerStore.resume();
                } else {
                  restTimerStore.pause();
                }
              }}
            >
              {paused ? (
                <Play aria-hidden="true" className="size-4" />
              ) : (
                <Pause aria-hidden="true" className="size-4" />
              )}
              {paused ? t('workouts.rest.resume') : t('workouts.rest.pause')}
            </button>
          )}
          {/* Parar y saltar son lo mismo: se acaba el descanso y no suena nada (D-3.7-1). */}
          <button
            type="button"
            className={cn(CONTROL, finished && 'bg-primary text-on-primary hover:bg-primary')}
            onClick={() => {
              restTimerStore.stop();
            }}
          >
            {finished ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <SkipForward aria-hidden="true" className="size-4" />
            )}
            {finished ? t('workouts.rest.close') : t('workouts.rest.skip')}
          </button>
        </div>
      </div>
      {finished ? null : (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          <button
            type="button"
            className={CONTROL}
            aria-label={t('workouts.rest.minus', { seconds: REST_ADJUST_SECONDS })}
            onClick={() => {
              restTimerStore.adjust(-REST_ADJUST_SECONDS);
            }}
          >
            −{REST_ADJUST_SECONDS} s
          </button>
          <button
            type="button"
            className={CONTROL}
            aria-label={t('workouts.rest.plus', { seconds: REST_ADJUST_SECONDS })}
            onClick={() => {
              restTimerStore.adjust(REST_ADJUST_SECONDS);
            }}
          >
            +{REST_ADJUST_SECONDS} s
          </button>
          <span aria-hidden="true" className="bg-hairline-strong mx-1 my-2 w-px shrink-0" />
          {REST_SHORTCUTS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={cn(CONTROL, 'tabular-nums')}
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
