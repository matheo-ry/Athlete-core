import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { useFeature } from '@/core/flags';
import { logger } from '@/core/lib';
import { getUploadQueue, onAppResume, retryDelayMs } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { refreshOfflineSnapshot } from './offline-snapshot-api';
import { sendWorkout } from './sync-workout-api';

const SENDERS = { workout: sendWorkout };
/** Al volver a la app varias veces seguidas, no se descarga todo cada vez. */
const REFRESH_EVERY_MS = 60_000;

/** Llama a `run` al abrir, al volver la conexión y al volver a la app. */
function whenConnected(run: () => void): () => void {
  run();
  window.addEventListener('online', run);
  const stopResume = onAppResume(run);
  return () => {
    window.removeEventListener('online', run);
    stopResume();
  };
}

/**
 * Sube lo pendiente de la cola (D-118 y D-143), en cualquier espacio: también
 * lo de un negocio en el que el cliente ya no está, para poder avisarle. Si
 * falla, se reintenta cada vez más tarde; también al volver la conexión, al
 * volver a la app y cuando se encola algo nuevo.
 */
export function useUploadPending(userId: string, onUploaded?: () => void): void {
  useEffect(() => {
    const queue = getUploadQueue();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const run = () => {
      clearTimeout(timer);
      if (!navigator.onLine) {
        return;
      }
      void queue.process(userId, SENDERS).then((result) => {
        if (!stopped && result.uploaded > 0) {
          onUploaded?.();
        }
        if (!stopped && result.failedAttempts !== null) {
          timer = setTimeout(run, retryDelayMs(result.failedAttempts));
        }
      });
    };

    const stop = whenConnected(run);
    // Algo recién encolado (sin intentos) se sube enseguida. Lo que ya falló
    // espera a su reintento: si no, sin conexión se reintentaría sin parar.
    const unsubscribe = queue.subscribe(() => {
      void queue.list(userId).then((items) => {
        if (items.some((item) => item.status === 'pending' && item.attempts === 0)) {
          run();
        }
      });
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      stop();
      unsubscribe();
    };
  }, [userId, onUploaded]);
}

/**
 * En el espacio activo, si es de cliente: al abrir la app o volver a ella con
 * conexión, descarga lo necesario para entrenar sin cobertura (D-118). Sin
 * conexión, se queda lo último guardado.
 */
export function useOfflineSnapshotRefresh(userId: string): () => void {
  const queryClient = useQueryClient();
  const { tenant, role } = useTenancy();
  const enabled = useFeature('workouts');
  const tenantId = role === 'client' && enabled ? (tenant?.id ?? null) : null;

  const lastRun = useRef(0);
  const refresh = useCallback(
    (force: boolean) => {
      if (tenantId === null || !navigator.onLine) {
        return;
      }
      if (!force && Date.now() - lastRun.current < REFRESH_EVERY_MS) {
        return;
      }
      lastRun.current = Date.now();
      refreshOfflineSnapshot(queryClient, userId, tenantId).catch((error: unknown) => {
        // Se reintenta en la próxima vuelta a la app.
        lastRun.current = 0;
        logger.warn('Could not refresh the offline workout data', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    },
    [queryClient, userId, tenantId],
  );

  useEffect(() => {
    if (tenantId === null) {
      return undefined;
    }
    lastRun.current = 0;
    return whenConnected(() => {
      refresh(false);
    });
  }, [refresh, tenantId]);

  // Tras subir un entreno, "la vez anterior" cambia (PR 3.5b): se descarga ya.
  return useCallback(() => {
    refresh(true);
  }, [refresh]);
}
