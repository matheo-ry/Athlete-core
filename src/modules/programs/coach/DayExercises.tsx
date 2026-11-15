import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';
import { ExercisePicker, useExerciseOptions } from '@/modules/exercises';

import type { CycleEditorAction } from '../model/cycle-editor';
import { dayCounts } from '../model/cycle-editor';
import { hasSetData } from '../model/day-exercises';
import type { ProgramDay } from '../model/program-document';

interface DayExercisesProps {
  day: ProgramDay;
  onChange: (action: CycleEditorAction) => void;
}

/**
 * Los ejercicios de un día de entreno, en orden (PR 2.9): el total arriba,
 * "Añadir ejercicio" con el buscador de "Ejercicios" sin salir de la rutina,
 * "Subir", "Bajar" y "Quitar". Todo entra en "Guardar cambios".
 */
export function DayExercises({ day, onChange }: DayExercisesProps) {
  const { t } = useTranslation();
  const options = useExerciseOptions();
  const [isPicking, setIsPicking] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<number | null>(null);
  const counts = dayCounts(day);
  const last = day.exercises.length - 1;

  if (isPicking) {
    return (
      <ExercisePicker
        title={t('programs.editor.addExercise')}
        onPick={(exercise) => {
          onChange({ type: 'addExercise', dayNumber: day.dayNumber, exerciseId: exercise.id });
          setIsPicking(false);
        }}
        onCancel={() => setIsPicking(false)}
      />
    );
  }

  const remove = (index: number) => {
    setConfirmingRemove(null);
    onChange({ type: 'removeExercise', dayNumber: day.dayNumber, index });
  };
  const move = (index: number, direction: -1 | 1) =>
    onChange({ type: 'moveExercise', dayNumber: day.dayNumber, index, direction });

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        {t('programs.editor.exercises', { count: counts.exercises })} ·{' '}
        {t('programs.editor.sets', { count: counts.sets })}
      </p>
      {day.exercises.length > 0 ? (
        <ol aria-label={t('programs.editor.exercisesLabel')} className="flex flex-col">
          {day.exercises.map((item, index) => {
            const name = options.byId.get(item.exerciseId)?.name ?? '…';
            return (
              // El ejercicio de la rutina puede no tener id todavía (sin guardar).
              <li
                key={item.id ?? `new-${String(index)}-${item.exerciseId}`}
                className="border-border flex flex-col gap-2 border-b py-2 last:border-b-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium break-words">
                      {index + 1}. {name}
                    </span>
                    <span className="text-muted text-sm">
                      {t('programs.editor.sets', { count: item.sets.length })}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      aria-label={t('programs.editor.moveUp', { name })}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={t('programs.editor.moveDown', { name })}
                      disabled={index === last}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={t('programs.editor.remove', { name })}
                      onClick={() =>
                        hasSetData(item) ? setConfirmingRemove(index) : remove(index)
                      }
                    >
                      ✕
                    </Button>
                  </span>
                </div>
                {confirmingRemove === index ? (
                  <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
                    <p className="text-sm">{t('programs.editor.removeConfirm', { name })}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => remove(index)}>
                        {t('programs.editor.removeYes')}
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmingRemove(null)}>
                        {t('programs.form.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-muted text-sm">{t('programs.editor.noExercises')}</p>
      )}
      <Button variant="secondary" className="self-start" onClick={() => setIsPicking(true)}>
        {t('programs.editor.addExercise')}
      </Button>
    </div>
  );
}
