import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useExerciseOptions } from '@/modules/exercises';
import { Button, Card, Icon } from '@/core/ui';

import type { ClientWorkoutRecord } from '../model/workout-correction';

interface WorkoutCorrectionDialogProps {
  workout: ClientWorkoutRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ClientWorkoutRecord) => void;
}

/**
 * Modal para corregir un entreno cerrado durante 7 días (D-124).
 * Permite cambiar pesos, repeticiones, RIR/intensidad y notas del día.
 */
export function WorkoutCorrectionDialog({
  workout,
  isOpen,
  onClose,
  onSave,
}: WorkoutCorrectionDialogProps) {
  if (!isOpen) {
    return null;
  }

  return <CorrectionDialogContent workout={workout} onClose={onClose} onSave={onSave} />;
}

function CorrectionDialogContent({
  workout,
  onClose,
  onSave,
}: {
  workout: ClientWorkoutRecord;
  onClose: () => void;
  onSave: (updated: ClientWorkoutRecord) => void;
}) {
  const { t } = useTranslation();
  const exerciseOptions = useExerciseOptions();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Copia local para editar
  const [draft, setDraft] = useState<ClientWorkoutRecord>(
    () => JSON.parse(JSON.stringify(workout)) as ClientWorkoutRecord,
  );

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: 'weight_kg' | 'reps' | 'intensity_value',
    val: string,
  ) => {
    const num = val === '' ? null : Number(val);
    setDraft((prev) => ({
      ...prev,
      workout_exercises: prev.workout_exercises.map((we) => {
        if (we.id !== exerciseId) return we;
        return {
          ...we,
          workout_sets: we.workout_sets.map((s) => {
            if (s.id !== setId) return s;
            const updated = { ...s, [field]: num };
            if (field === 'weight_kg' || field === 'reps') {
              if (updated.weight_kg !== null || updated.reps !== null) {
                updated.is_done = true;
              }
            }
            return updated;
          }),
        };
      }),
    }));
  };

  const handleDayNoteChange = (exerciseId: string, note: string) => {
    setDraft((prev) => ({
      ...prev,
      workout_exercises: prev.workout_exercises.map((we) =>
        we.id === exerciseId ? { ...we, day_note: note || null } : we,
      ),
    }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div
      className="bg-background/80 fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="surface border-border flex max-h-[90vh] w-full max-w-xl flex-col rounded-t-3xl border p-5 shadow-2xl focus:outline-none md:rounded-3xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id={titleId} className="text-lg font-semibold">
            {t('workouts.history.correctTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring text-muted hover:text-foreground p-1 rounded-lg"
            aria-label={t('workouts.history.cancel')}
          >
            <Icon name="check" className="sr-only" />✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-5">
          {draft.workout_exercises.map((we, exIndex) => {
            const opt = exerciseOptions.byId.get(we.exercise_id);
            const exName = opt?.name ?? t('workouts.coachTab.unknownExercise');

            return (
              <Card key={we.id} className="flex flex-col gap-3 p-3">
                <span className="font-semibold text-sm">
                  {exIndex + 1}. {exName}
                </span>

                <div className="flex flex-col gap-2">
                  {we.workout_sets.map((s) => {
                    const sideLabel =
                      s.side === 'right'
                        ? ` · ${t('workouts.set.side.right')}`
                        : s.side === 'left'
                          ? ` · ${t('workouts.set.side.left')}`
                          : '';

                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 flex-wrap text-xs bg-surface/40 p-2 rounded-xl"
                      >
                        <span className="w-16 font-medium text-muted">
                          {t('workouts.set.label', { number: s.set_number })}
                          {sideLabel}
                        </span>

                        <div className="flex items-center gap-1">
                          <label className="text-muted text-[10px]">
                            {t('workouts.history.weight')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={s.weight_kg ?? ''}
                            onChange={(e) =>
                              handleSetChange(we.id, s.id, 'weight_kg', e.target.value)
                            }
                            className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground font-mono"
                            data-testid={`set-weight-input-${we.id}-${s.set_number}`}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-muted text-[10px]">
                            {t('workouts.history.reps')}
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={s.reps ?? ''}
                            onChange={(e) => handleSetChange(we.id, s.id, 'reps', e.target.value)}
                            className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground font-mono"
                            data-testid={`set-reps-input-${we.id}-${s.set_number}`}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-muted text-[10px]">
                            {t('workouts.history.intensity')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={s.intensity_value ?? ''}
                            onChange={(e) =>
                              handleSetChange(we.id, s.id, 'intensity_value', e.target.value)
                            }
                            placeholder="RIR"
                            className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <label className="text-xs text-muted">{t('workouts.history.dayNote')}</label>
                  <input
                    type="text"
                    value={we.day_note ?? ''}
                    onChange={(e) => handleDayNoteChange(we.id, e.target.value)}
                    placeholder={t('workouts.exercise.dayNotePlaceholder')}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                    data-testid={`day-note-input-${we.id}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            {t('workouts.history.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave} data-testid="save-correction-button">
            {t('workouts.history.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
