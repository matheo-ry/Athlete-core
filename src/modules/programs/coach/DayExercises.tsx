import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';
import { ExercisePicker, useExerciseOptions } from '@/modules/exercises';
import type { Measurement } from '@/modules/exercises';

import type { CycleEditorAction } from '../model/cycle-editor';
import { dayCounts } from '../model/cycle-editor';
import type { ProgramDay } from '../model/program-document';
import { DayExerciseRow } from './DayExerciseRow';

interface DayExercisesProps {
  day: ProgramDay;
  onChange: (action: CycleEditorAction) => void;
}

/** Qué se está eligiendo en el buscador: uno nuevo o el sustituto de otro. */
type Picking =
  { kind: 'add' } | { kind: 'replace'; index: number; name: string; measurement: Measurement };

/**
 * Los ejercicios de un día de entreno, en orden (PR 2.9): el total arriba y
 * "Añadir ejercicio" con el buscador de "Ejercicios", sin salir de la rutina.
 * "Sustituir" solo ofrece los que se miden igual (D-078). Todo entra en
 * "Guardar cambios".
 */
export function DayExercises({ day, onChange }: DayExercisesProps) {
  const { t } = useTranslation();
  const options = useExerciseOptions();
  const [picking, setPicking] = useState<Picking | null>(null);
  const counts = dayCounts(day);
  const dayNumber = day.dayNumber;

  if (picking !== null) {
    return (
      <ExercisePicker
        title={
          picking.kind === 'add'
            ? t('programs.editor.addExercise')
            : t('programs.editor.replaceTitle', { name: picking.name })
        }
        measurement={picking.kind === 'replace' ? picking.measurement : undefined}
        onPick={(exercise) => {
          onChange(
            picking.kind === 'add'
              ? { type: 'addExercise', dayNumber, exerciseId: exercise.id }
              : {
                  type: 'replaceExercise',
                  dayNumber,
                  index: picking.index,
                  exerciseId: exercise.id,
                },
          );
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        {t('programs.editor.exercises', { count: counts.exercises })} ·{' '}
        {t('programs.editor.sets', { count: counts.sets })}
      </p>
      {day.exercises.length > 0 ? (
        <ol aria-label={t('programs.editor.exercisesLabel')} className="flex flex-col">
          {day.exercises.map((item, index) => {
            const exercise = options.byId.get(item.exerciseId);
            return (
              <DayExerciseRow
                // Un ejercicio sin guardar todavía no tiene id.
                key={item.id ?? `new-${String(index)}-${item.exerciseId}`}
                item={item}
                position={index + 1}
                exercise={exercise}
                isFirst={index === 0}
                isLast={index === day.exercises.length - 1}
                onMove={(direction) =>
                  onChange({ type: 'moveExercise', dayNumber, index, direction })
                }
                onRemove={() => onChange({ type: 'removeExercise', dayNumber, index })}
                onReplace={() => {
                  if (exercise !== undefined) {
                    setPicking({
                      kind: 'replace',
                      index,
                      name: exercise.name,
                      measurement: exercise.measurement,
                    });
                  }
                }}
                onNote={(note) => onChange({ type: 'setExerciseNote', dayNumber, index, note })}
                onPrescription={(changed) =>
                  onChange({ type: 'setExercise', dayNumber, index, item: changed })
                }
              />
            );
          })}
        </ol>
      ) : (
        <p className="text-muted text-sm">{t('programs.editor.noExercises')}</p>
      )}
      <Button
        variant="secondary"
        className="self-start"
        onClick={() => setPicking({ kind: 'add' })}
      >
        {t('programs.editor.addExercise')}
      </Button>
    </div>
  );
}
