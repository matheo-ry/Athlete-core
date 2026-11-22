import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/core/ui';

import { emptyFormValues, formValuesOf } from '../model/exercise-form';
import type { ExerciseListItem } from '../model/exercise-list';
import type { Exercise } from '../model/exercise-schema';
import { ExerciseActions } from './ExerciseActions';
import type { ExerciseNotice } from './ExerciseActions';
import { ExerciseForm } from './ExerciseForm';

export type PanelTarget =
  { kind: 'new'; name: string } | { kind: 'edit'; exercise: ExerciseListItem };

interface ExercisePanelProps {
  target: PanelTarget;
  /** Guardado, archivado, recuperado o restaurado: el panel se cierra. */
  onDone: (exercise: Exercise, notice: ExerciseNotice) => void;
  /** La copia de "Duplicar": se abre su formulario. */
  onDuplicated: (copy: Exercise) => void;
  onClose: () => void;
}

/**
 * "Nuevo ejercicio" o "Editar ejercicio". En el móvil ocupa la pantalla (la
 * lista se oculta); en escritorio es un panel junto a la lista.
 */
export function ExercisePanel({ target, onDone, onDuplicated, onClose }: ExercisePanelProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const exercise = target.kind === 'edit' ? target.exercise : null;

  // Al abrirlo, el foco va al título: lo anuncia el lector de pantalla y, en
  // el móvil, la pantalla vuelve arriba.
  useEffect(() => {
    heading.current?.focus();
  }, [exercise?.id]);

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      className="flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
    >
      <h2 id={titleId} ref={heading} tabIndex={-1} className="text-xl font-semibold tracking-tight">
        {exercise === null ? t('exercises.form.newTitle') : t('exercises.form.editTitle')}
      </h2>
      <ExerciseForm
        // Otro ejercicio = formulario nuevo, sin lo escrito en el anterior.
        key={exercise?.id ?? `new:${target.kind === 'new' ? target.name : ''}`}
        exercise={exercise}
        initialValues={
          exercise === null
            ? emptyFormValues(target.kind === 'new' ? target.name : '')
            : formValuesOf(exercise, exercise.displayName)
        }
        onSaved={(saved) => onDone(saved, 'saved')}
        onCancel={onClose}
      />
      {exercise !== null ? (
        <ExerciseActions exercise={exercise} onDone={onDone} onDuplicated={onDuplicated} />
      ) : null}
    </Card>
  );
}
