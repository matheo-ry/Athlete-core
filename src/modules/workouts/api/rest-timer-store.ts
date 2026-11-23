import { useSyncExternalStore } from 'react';

import { cancelLocalNotification, scheduleLocalNotification } from '@/core/native';

import {
  adjustRest,
  pauseRest,
  remainingMs,
  resumeRest,
  setRest,
  startRest,
} from '../model/rest-timer';
import type { RestTimer } from '../model/rest-timer';

// El cronómetro de descanso es de toda la app (D-123): vive aquí, fuera de las
// pantallas, para seguir cuando se pasa de un ejercicio a otro. Un solo
// descanso a la vez. Mientras corre hay una notificación programada en el
// móvil, que suena aunque la pantalla esté apagada (D-135).

/** Número fijo de la notificación del descanso: programar otra sustituye a la anterior. */
export const REST_NOTIFICATION_ID = 2_100_000_000;

export interface RestTexts {
  title: string;
  body: string;
}

interface State {
  timer: RestTimer | null;
  texts: RestTexts | null;
  /** Lo cambiado a mano: vale solo para ese entreno y no se recuerda después (D-123). */
  manual: { workoutId: string; seconds: number } | null;
}

let state: State = { timer: null, texts: null, manual: null };
const listeners = new Set<() => void>();

function update(next: State): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

/** Programa (o cancela) el aviso del móvil según cómo queda el descanso. */
function syncNotification(timer: RestTimer | null, texts: RestTexts | null, nowMs: number): void {
  if (timer === null || texts === null || timer.endsAtMs === null) {
    void cancelLocalNotification(REST_NOTIFICATION_ID);
    return;
  }
  void scheduleLocalNotification({
    id: REST_NOTIFICATION_ID,
    title: texts.title,
    body: texts.body,
    at: new Date(nowMs + remainingMs(timer, nowMs)),
  });
}

function replace(timer: RestTimer | null, texts: RestTexts | null, nowMs: number): void {
  syncNotification(timer, texts, nowMs);
  update({ ...state, timer, texts });
}

export const restTimerStore = {
  /** Empieza un descanso nuevo (sustituye al que hubiera). */
  start(workoutId: string, seconds: number, texts: RestTexts, nowMs = Date.now()): void {
    replace(startRest(workoutId, seconds, nowMs), texts, nowMs);
  },
  pause(nowMs = Date.now()): void {
    if (state.timer !== null) {
      replace(pauseRest(state.timer, nowMs), state.texts, nowMs);
    }
  },
  resume(nowMs = Date.now()): void {
    if (state.timer !== null) {
      replace(resumeRest(state.timer, nowMs), state.texts, nowMs);
    }
  },
  adjust(deltaSeconds: number, nowMs = Date.now()): void {
    if (state.timer !== null) {
      replace(adjustRest(state.timer, deltaSeconds, nowMs), state.texts, nowMs);
    }
  },
  /** Un atajo: este descanso y los siguientes de este entreno pasan a ser ese. */
  preset(seconds: number, nowMs = Date.now()): void {
    if (state.timer === null) {
      return;
    }
    const timer = setRest(state.timer, seconds, nowMs);
    syncNotification(timer, state.texts, nowMs);
    update({
      timer,
      texts: state.texts,
      manual: { workoutId: timer.workoutId, seconds },
    });
  },
  /** Parar o saltar: se acaba el descanso y no suena nada. */
  stop(): void {
    replace(null, null, Date.now());
  },
  manualSecondsFor(workoutId: string): number | null {
    return state.manual?.workoutId === workoutId ? state.manual.seconds : null;
  },
  /** Para los tests. */
  reset(): void {
    update({ timer: null, texts: null, manual: null });
  },
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** El descanso en marcha (o `null`), y se vuelve a pintar cuando cambia. */
export function useRestTimer(): RestTimer | null {
  return useSyncExternalStore(subscribe, () => state.timer);
}
