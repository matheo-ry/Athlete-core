import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { formatDate, formatWeight } from '@/core/lib';
import { useLanguage } from '@/core/i18n';
import type { ClientProfileTabProps } from '@/core/modules';
import { Card, EmptyState, ErrorState, Spinner, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useClientHealthData, useClientWorkouts } from '../api/useClientWorkouts';
import {
  compareExercisePerformance,
  findPreviousExerciseSets,
  formatDurationBetween,
  formatExerciseSetsExcel,
} from '../model/workout-format';
import type { HistoryItem, WorkoutRecord } from '../model/workout-types';

/**
 * Pestaña "Entrenos" en la ficha del cliente para el coach (PR 3.13, D-124, D-126, D-127, D-128).
 * Muestra el consentimiento y datos de salud (peso y medidas) y la lista de entrenos y días faltados.
 */
export function ClientWorkoutsTab({ clientId }: ClientProfileTabProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const profile = useProfile();
  const weightUnit = profile.data?.weightUnit ?? 'kg';

  const workoutsQuery = useClientWorkouts(clientId);
  const healthQuery = useClientHealthData(clientId);
  const exerciseOptions = useExerciseOptions();

  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(() => new Set());

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

  const historyItems: HistoryItem[] = useMemo(() => {
    const workoutsList: HistoryItem[] = workoutsQuery.workouts.map((w) => ({
      type: 'workout',
      id: w.id,
      date: w.performed_on,
      dayNumber: w.day_number,
      programDayId: w.program_day_id,
      workout: w,
    }));

    const missedList: HistoryItem[] = workoutsQuery.missedDays.map((m) => ({
      type: 'missed_day',
      id: m.id,
      date: m.missed_on,
      dayNumber: m.day_number,
      programDayId: m.program_day_id,
      missedDay: m,
    }));

    return [...workoutsList, ...missedList].sort((a, b) => b.date.localeCompare(a.date));
  }, [workoutsQuery.workouts, workoutsQuery.missedDays]);

  if (workoutsQuery.isPending || healthQuery.isPending) {
    return <Spinner />;
  }

  if (workoutsQuery.isError || healthQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void workoutsQuery.refetch();
          void healthQuery.refetch();
        }}
      />
    );
  }

  const healthData = healthQuery.data;
  const latestWeight = healthData?.weights[0] ?? null;

  // Filtrar las medidas más recientes de cada combinación tipo + lado
  const latestMeasurements = (() => {
    if (!healthData?.measurements) return [];
    const seen = new Set<string>();
    const result = [];
    for (const m of healthData.measurements) {
      const key = `${m.kind}:${m.side ?? 'none'}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(m);
      }
    }
    return result;
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* 1. SECCIÓN DE DATOS DE SALUD (D-126, D-127) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t('workouts.health.title')}</h2>
        {!healthData?.hasConsent ? (
          <Card className="border-border/80 bg-surface">
            <p className="text-muted text-sm" data-testid="health-consent-notice">
              {t('workouts.health.consentNotice')}
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Peso corporal */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted">
                  {t('workouts.health.weightTitle')}
                </span>
                {latestWeight !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatWeight(latestWeight.weight_kg, weightUnit, language)}
                    </span>
                    <span className="text-xs text-muted">
                      {t('workouts.health.measuredOn', {
                        date: formatDate(latestWeight.measured_on, language),
                      })}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t('workouts.health.noWeight')}</p>
                )}
              </div>

              {/* Medidas */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted">
                  {t('workouts.health.measurementsTitle')}
                </span>
                {latestMeasurements.length > 0 ? (
                  <ul className="flex flex-col gap-1 text-sm divide-y divide-border/40">
                    {latestMeasurements.map((m) => {
                      const kindLabel = t(`workouts.measurements.${m.kind}`, m.kind);
                      const sideLabel = m.side
                        ? ` (${t(`workouts.measurements.${m.side}`, m.side)})`
                        : '';
                      const valStr =
                        weightUnit === 'lb'
                          ? `${Number((m.value_cm / 2.54).toFixed(1))} in`
                          : `${m.value_cm} cm`;
                      return (
                        <li key={m.id} className="flex justify-between py-1 text-sm">
                          <span>
                            {kindLabel}
                            {sideLabel}:
                          </span>
                          <span className="font-medium">{valStr}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">{t('workouts.health.noMeasurements')}</p>
                )}
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* 2. LISTA DE ENTRENOS Y DÍAS FALTADOS (D-124, D-128) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('workouts.coachTab.title')}</h2>

        {historyItems.length === 0 ? (
          <EmptyState title={t('workouts.coachTab.empty')} />
        ) : (
          <div className="flex flex-col gap-3">
            {historyItems.map((item) => {
              if (item.type === 'missed_day') {
                const dayName =
                  workoutsQuery.daysMap.get(item.programDayId ?? '') ??
                  t('workouts.coachTab.day', { number: item.dayNumber });

                return (
                  <Card
                    key={`missed-${item.id}`}
                    className="flex items-center justify-between p-4 border-dashed border-border"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{dayName}</span>
                        <span className="rounded bg-accent/10 text-accent px-2 py-0.5 text-xs font-semibold">
                          {t('workouts.coachTab.missed')}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {formatDate(item.date, language)} ·{' '}
                        {t('workouts.coachTab.missedDescription')}
                      </span>
                    </div>
                  </Card>
                );
              }

              const workout: WorkoutRecord = item.workout;
              const isExpanded = expandedWorkouts.has(workout.id);
              const dayName =
                workoutsQuery.daysMap.get(workout.program_day_id ?? '') ??
                t('workouts.coachTab.day', { number: workout.day_number });

              const doneSetsCount = workout.workout_exercises.reduce(
                (acc, we) => acc + we.workout_sets.filter((s) => s.is_done).length,
                0,
              );

              const duration = formatDurationBetween(workout.started_at, workout.closed_at);

              return (
                <Card key={`workout-${workout.id}`} className="flex flex-col gap-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{dayName}</span>
                        {workout.closed_at === null ? (
                          <span className="rounded bg-primary/10 text-primary-readable px-2 py-0.5 text-xs font-semibold">
                            {t('workouts.coachTab.inProgress')}
                          </span>
                        ) : null}
                        {workout.edited_at !== null ? (
                          <span className="rounded bg-surface border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                            {t('workouts.coachTab.edited')}
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

                  {/* UN ENTRENO POR DENTRO (D-128) */}
                  {isExpanded ? (
                    <div className="flex flex-col gap-3 pt-3 border-t border-border">
                      {workout.workout_exercises.map((we) => {
                        const opt = exerciseOptions.byId.get(we.exercise_id);
                        const exName = opt?.name ?? t('workouts.coachTab.unknownExercise');
                        const replacedOpt = we.replaces_exercise_id
                          ? exerciseOptions.byId.get(we.replaces_exercise_id)
                          : null;
                        const setup = workoutsQuery.setupsMap.get(we.exercise_id);
                        const setsNotation = formatExerciseSetsExcel(we.workout_sets);
                        const prevSets = findPreviousExerciseSets(
                          workoutsQuery.workouts,
                          workout.id,
                          we.exercise_id,
                        );
                        const arrow = compareExercisePerformance(we.workout_sets, prevSets);

                        return (
                          <div
                            key={we.id}
                            className="flex flex-col gap-1 p-3 rounded-lg bg-surface/50 border border-border/50"
                          >
                            <div className="flex items-center gap-2 flex-wrap justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{exName}</span>
                                {we.is_skipped ? (
                                  <span className="rounded bg-muted/20 text-muted px-1.5 py-0.5 text-xs">
                                    {t('workouts.coachTab.skipped')}
                                  </span>
                                ) : null}
                                {replacedOpt !== null && replacedOpt !== undefined ? (
                                  <span className="rounded bg-primary/10 text-primary-readable px-1.5 py-0.5 text-xs">
                                    {t('workouts.coachTab.replaced', { name: replacedOpt.name })}
                                  </span>
                                ) : null}
                              </div>

                              {/* Flecha frente a la vez anterior */}
                              {arrow !== null ? (
                                <span
                                  className={`text-sm font-bold ${
                                    arrow === 'up'
                                      ? 'text-primary-readable'
                                      : arrow === 'down'
                                        ? 'text-danger'
                                        : 'text-muted'
                                  }`}
                                  aria-label={
                                    arrow === 'up'
                                      ? t('workouts.coachTab.performanceBetter')
                                      : arrow === 'down'
                                        ? t('workouts.coachTab.performanceWorse')
                                        : t('workouts.coachTab.performanceSame')
                                  }
                                  title={
                                    arrow === 'up'
                                      ? t('workouts.coachTab.performanceBetter')
                                      : arrow === 'down'
                                        ? t('workouts.coachTab.performanceWorse')
                                        : t('workouts.coachTab.performanceSame')
                                  }
                                >
                                  {arrow === 'up' ? '↑' : arrow === 'down' ? '↓' : '→'}
                                </span>
                              ) : null}
                            </div>

                            {/* Series como en el Excel */}
                            <div className="text-sm font-mono text-foreground font-medium pt-1">
                              {setsNotation}
                            </div>

                            {/* Set-up del cliente */}
                            {setup !== undefined ? (
                              <p className="text-xs text-muted">
                                {t('workouts.coachTab.setup', { setup })}
                              </p>
                            ) : null}

                            {/* Nota del coach */}
                            {we.coach_note ? (
                              <p className="text-xs text-muted italic">
                                {t('workouts.coachTab.coachNote', { note: we.coach_note })}
                              </p>
                            ) : null}

                            {/* Nota del día del cliente */}
                            {we.day_note ? (
                              <p className="text-xs font-medium text-primary-readable pt-0.5">
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
      </section>
    </div>
  );
}
