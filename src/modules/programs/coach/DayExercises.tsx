import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';
import { ExercisePicker, useExerciseOptions } from '@/modules/exercises';
import type { Measurement } from '@/modules/exercises';

import type { CycleEditorAction } from '../model/cycle-editor';
import { dayCounts } from '../model/cycle-editor';
import type { ProgramDay } from '../model/program-document';
import { canGroupWithNext, groupInfo } from '../model/supersets';
import { DayExerciseRow } from './DayExerciseRow';
import { ExerciseTabs } from './ExerciseTabs';
import { useProgramClipboard } from './useProgramClipboard';
import { useSwipe } from './useSwipe';

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
 * Se ven de uno en uno (D-106): una fila de números y, debajo, el elegido;
 * en el móvil también se pasa al de al lado deslizando.
 * "Sustituir" solo ofrece los que se miden igual (D-078). Todo entra en
 * "Guardar cambios".
 */
export function DayExercises({ day, onChange }: DayExercisesProps) {
  const { t } = useTranslation();
  const options = useExerciseOptions();
  const [picking, setPicking] = useState<Picking | null>(null);
  const { clipboard, copy } = useProgramClipboard();
  const counts = dayCounts(day);
  const dayNumber = day.dayNumber;
  // Qué ejercicio se ve. Al cambiar de día se vuelve al primero.
  const [selection, setSelection] = useState({ dayNumber, index: 0 });
  const lastIndex = day.exercises.length - 1;
  const selected = Math.max(
    0,
    Math.min(selection.dayNumber === dayNumber ? selection.index : 0, lastIndex),
  );
  const select = (index: number) => setSelection({ dayNumber, index });
  const swipe = useSwipe({
    onPrevious: () => select(Math.max(selected - 1, 0)),
    onNext: () => select(Math.min(selected + 1, lastIndex)),
  });
  const item = day.exercises[selected];
  const exercise = item === undefined ? undefined : options.byId.get(item.exerciseId);

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
          // El recién añadido va al final: se pasa a él.
          if (picking.kind === 'add') {
            select(day.exercises.length);
          }
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
      {item !== undefined ? (
        <>
          <ExerciseTabs
            items={day.exercises}
            byId={options.byId}
            day={day}
            selected={selected}
            onSelect={select}
          />
          <div {...swipe}>
            <DayExerciseRow
              // Al cambiar de ejercicio se cierran la nota a medias y la confirmación.
              key={`${String(dayNumber)}-${String(selected)}-${item.id ?? item.exerciseId}`}
              item={item}
              position={selected + 1}
              exercise={exercise}
              isFirst={selected === 0}
              isLast={selected === lastIndex}
              onMove={(direction) => {
                onChange({ type: 'moveExercise', dayNumber, index: selected, direction });
                select(selected + direction);
              }}
              onRemove={() => onChange({ type: 'removeExercise', dayNumber, index: selected })}
              onReplace={() => {
                if (exercise !== undefined) {
                  setPicking({
                    kind: 'replace',
                    index: selected,
                    name: exercise.name,
                    measurement: exercise.measurement,
                  });
                }
              }}
              onNote={(note) =>
                onChange({ type: 'setExerciseNote', dayNumber, index: selected, note })
              }
              onDuplicate={() => {
                onChange({ type: 'duplicateExercise', dayNumber, index: selected });
                select(selected + 1);
              }}
              onCopy={() => copy({ kind: 'exercise', item })}
              group={groupInfo(day, selected)}
              onGroup={
                canGroupWithNext(day, selected)
                  ? () => onChange({ type: 'groupWithNext', dayNumber, index: selected })
                  : null
              }
              onUngroup={() => onChange({ type: 'ungroup', dayNumber, index: selected })}
              onPrescription={(changed) =>
                onChange({ type: 'setExercise', dayNumber, index: selected, item: changed })
              }
            />
          </div>
        </>
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
      {clipboard?.kind === 'exercise' ? (
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => {
            onChange({ type: 'pasteExercise', dayNumber, item: clipboard.item });
            select(day.exercises.length);
          }}
        >
          {t('programs.copy.pasteExercise')}
        </Button>
      ) : null}
    </div>
  );
}
