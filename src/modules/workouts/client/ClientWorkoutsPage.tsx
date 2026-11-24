import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import { canLogWorkouts } from '@/core/native';
import { Card, EmptyState, ErrorState, PageHeader, Spinner, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useClientHistory, useCorrectWorkout } from '../api/useClientHistory';
import {
  canCorrectWorkout,
  isPreviousRoutine,
  type ClientWorkoutRecord,
} from '../model/workout-correction';
import { formatDurationBetween, formatExerciseSetsExcel } from '../model/workout-format';
import { WorkoutCorrectionDialog } from './WorkoutCorrectionDialog';

/**
 * Vista "Mis entrenos" del cliente (/client/history, D-116, D-124, D-129).
 * - En la app y en la web (en la web, solo lectura).
 * - Orden del más nuevo al más viejo.
 * - Series con formato "45×8(1) / 45×7(1)".
 * - Marcas "Editado" y "Pendiente de subir".
 * - "Corregir" en la app durante 7 días desde el cierre.
 * - Entrenos de rutinas anteriores con el nombre de su rutina.
 */
export function ClientWorkoutsPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const isMobile = canLogWorkouts();

  const history = useClientHistory();
  const exerciseOptions = useExerciseOptions();
  const correctMutation = useCorrectWorkout();

  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(() => new Set());
  const [correctingWorkout, setCorrectingWorkout] = useState<ClientWorkoutRecord | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (history.isPending) {
    return <Spinner />;
  }

  if (history.isError) {
    return <ErrorState onRetry={() => void history.refetch()} />;
  }

  const workouts = history.workouts;

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t('workouts.history.title')} />

      {workouts.length === 0 ? (
        <Card>
          <EmptyState title={t('workouts.history.empty')} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {workouts.map((workout) => {
            const isExpanded = expandedWorkouts.has(workout.id);
            const dayName =
              workout.program_days?.name ??
              t('workouts.coachTab.day', { number: workout.day_number });

            const doneSetsCount = workout.workout_exercises.reduce(
              (acc, we) => acc + we.workout_sets.filter((s) => s.is_done).length,
              0,
            );

            const duration = formatDurationBetween(workout.started_at, workout.closed_at);
            const isPrevious = isPreviousRoutine(workout.program_id, history.currentProgramId);
            const programName = workout.programs?.name;
            const isPendingUpload = history.pendingUploadIds.has(workout.id);
            const allowCorrection = canCorrectWorkout(workout, isMobile);

            return (
              <Card
                key={workout.id}
                className="flex flex-col gap-4 p-4"
                data-testid={`workout-card-${workout.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base">{dayName}</span>

                      {/* Rutina anterior */}
                      {isPrevious && programName ? (
                        <span
                          className="rounded bg-muted/20 text-muted px-2 py-0.5 text-xs font-medium"
                          data-testid="previous-routine-badge"
                        >
                          {programName}
                        </span>
                      ) : null}

                      {/* Marcas Editado y Pendiente de subir */}
                      {workout.edited_at !== null ? (
                        <span
                          className="rounded bg-surface border border-border px-2 py-0.5 text-xs font-semibold text-muted"
                          data-testid="edited-badge"
                        >
                          {t('workouts.coachTab.edited')}
                        </span>
                      ) : null}

                      {isPendingUpload ? (
                        <span
                          className="rounded bg-accent/10 text-accent px-2 py-0.5 text-xs font-semibold"
                          data-testid="pending-upload-badge"
                        >
                          {t('workouts.history.pendingUpload')}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                      <span>{formatDate(workout.performed_on, language)}</span>
                      <span>·</span>
                      <span>{t('workouts.coachTab.setsDone', { count: doneSetsCount })}</span>
                      {duration !== null ? (
                        <>
                          <span>·</span>
                          <span>{t('workouts.coachTab.duration', { duration })}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Corregir (solo app del móvil y durante 7 días, D-116, D-124) */}
                    {allowCorrection ? (
                      <button
                        type="button"
                        onClick={() => setCorrectingWorkout(workout)}
                        className={buttonClassName('primary')}
                        data-testid={`correct-workout-${workout.id}`}
                      >
                        {t('workouts.history.correct')}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleExpand(workout.id)}
                      className={buttonClassName('secondary')}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded
                        ? t('workouts.coachTab.hideDetails')
                        : t('workouts.coachTab.viewDetails')}
                    </button>
                  </div>
                </div>

                {/* Detalle del entreno */}
                {isExpanded ? (
                  <div className="flex flex-col gap-3 pt-3 border-t border-border">
                    {workout.note ? (
                      <p
                        className="text-xs font-medium text-primary-readable"
                        data-testid={`workout-note-${workout.id}`}
                      >
                        {t('workouts.coachTab.workoutNote', { note: workout.note })}
                      </p>
                    ) : null}
                    {workout.workout_exercises.map((we) => {
                      const opt = exerciseOptions.byId.get(we.exercise_id);
                      const exName = opt?.name ?? t('workouts.coachTab.unknownExercise');
                      const replacedOpt = we.replaces_exercise_id
                        ? exerciseOptions.byId.get(we.replaces_exercise_id)
                        : null;
                      const setsNotation = formatExerciseSetsExcel(we.workout_sets);

                      return (
                        <div
                          key={we.id}
                          className="flex flex-col gap-1 p-3 rounded-xl bg-surface/50 border border-border/50"
                        >
                          <div className="flex items-center gap-2 flex-wrap justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {replacedOpt === null || replacedOpt === undefined
                                  ? exName
                                  : replacedOpt.name}
                              </span>

                              {we.is_skipped ? (
                                <span className="rounded bg-muted/20 text-muted px-1.5 py-0.5 text-xs">
                                  {t('workouts.coachTab.skipped')}
                                </span>
                              ) : null}

                              {replacedOpt !== null && replacedOpt !== undefined ? (
                                <span className="rounded bg-primary/10 text-primary-readable px-1.5 py-0.5 text-xs">
                                  {t('workouts.coachTab.replaced', { name: exName })}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Series formateadas "45×8(1) / 45×7(1)" o "(F)" */}
                          <div
                            className="text-sm font-mono text-foreground font-medium pt-1"
                            data-testid={`exercise-sets-${we.id}`}
                          >
                            {setsNotation}
                          </div>

                          {/* Nota del coach */}
                          {we.coach_note ? (
                            <p className="text-xs text-muted italic">
                              {t('workouts.coachTab.coachNote', { note: we.coach_note })}
                            </p>
                          ) : null}

                          {/* Nota del día */}
                          {we.day_note ? (
                            <p
                              className="text-xs font-medium text-primary-readable pt-0.5"
                              data-testid={`day-note-${we.id}`}
                            >
                              {t('workouts.coachTab.dayNote', { note: we.day_note })}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {correctingWorkout !== null ? (
        <WorkoutCorrectionDialog
          workout={correctingWorkout}
          isOpen={true}
          onClose={() => setCorrectingWorkout(null)}
          onSave={(updated) => correctMutation.mutate(updated)}
        />
      ) : null}
    </section>
  );
}
