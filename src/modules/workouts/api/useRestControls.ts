import { useTranslation } from 'react-i18next';

import { DEFAULT_TRAINING_SETTINGS, useProfile } from '@/core/auth';

import { restSecondsFor, shouldStartRest } from '../model/rest-timer';
import { restTimerStore } from './rest-timer-store';

/**
 * Arrancar el descanso al apuntar una serie (D-123). `afterSet` se llama con
 * lo que había ANTES del cambio: solo el primer cambio de una serie (o
 * "Igual") lo arranca; corregirla no lo reinicia.
 */
export function useRestControls() {
  const { t } = useTranslation();
  const profile = useProfile().data;
  const autostart = profile?.restAutostart ?? DEFAULT_TRAINING_SETTINGS.restAutostart;
  const clientDefaultSeconds =
    profile?.defaultRestSeconds ?? DEFAULT_TRAINING_SETTINGS.defaultRestSeconds;

  return {
    sameButton: profile?.sameButton ?? DEFAULT_TRAINING_SETTINGS.sameButton,
    afterSet(input: { workoutId: string; coachSeconds: number | null; wasDone: boolean }): void {
      if (!shouldStartRest({ wasDone: input.wasDone, autostart })) {
        return;
      }
      const seconds = restSecondsFor({
        manualSeconds: restTimerStore.manualSecondsFor(input.workoutId),
        coachSeconds: input.coachSeconds,
        clientDefaultSeconds,
      });
      if (seconds > 0) {
        restTimerStore.start(input.workoutId, seconds, {
          title: t('workouts.rest.notificationTitle'),
          body: t('workouts.rest.notificationBody'),
        });
      }
    },
  };
}
