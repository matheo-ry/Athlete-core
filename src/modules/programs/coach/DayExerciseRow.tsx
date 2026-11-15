import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';
import { Button } from '@/core/ui';
import type { ExerciseOption } from '@/modules/exercises';

import { hasSetData } from '../model/day-exercises';
import { prescriptionSummary, targetKindOf } from '../model/prescription';
import type { ProgramDayExercise } from '../model/program-document';
import { PrescriptionEditor } from './PrescriptionEditor';

const TAG = 'rounded-full px-2 py-0.5 text-xs font-semibold';
const NOTE_MAX_LENGTH = 500;

interface DayExerciseRowProps {
  item: ProgramDayExercise;
  position: number;
  /** El ejercicio del negocio. Vacío mientras se cargan. */
  exercise: ExerciseOption | undefined;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onReplace: () => void;
  onNote: (note: string) => void;
  /** Cambia lo prescrito: las series y el descanso (PR 2.10). */
  onPrescription: (item: ProgramDayExercise) => void;
  /** Otro igual justo debajo (PR 2.11). */
  onDuplicate: () => void;
  /** Se copia para pegarlo en otro día o en otra rutina. */
  onCopy: () => void;
}

/**
 * Un ejercicio de un día (PR 2.9): su nombre, si está archivado y cuántas
 * series tiene; subir, bajar, sustituir y quitar; y la nota del coach.
 */
export function DayExerciseRow({
  item,
  position,
  exercise,
  isFirst,
  isLast,
  onMove,
  onRemove,
  onReplace,
  onNote,
  onPrescription,
  onDuplicate,
  onCopy,
}: DayExerciseRowProps) {
  const { t } = useTranslation();
  const noteId = useId();
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isWritingNote, setIsWritingNote] = useState(false);
  const language = useLanguage();
  const { intensityScale: scale } = useTenantSettings();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const name = exercise?.name ?? '…';
  const showNote = isWritingNote || item.note !== null;
  const summary = prescriptionSummary(item, {
    failureLabel: t('programs.prescription.failure'),
    unit,
    locale: language,
  });

  return (
    <li className="border-border flex flex-col gap-2 border-b py-2 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 flex-col">
          <span className="font-medium break-words">
            {position}. {name}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm">
            {/* El resumen de una línea (D-076); sin nada prescrito, solo cuántas series. */}
            <span className="text-muted">
              {summary === String(item.sets.length)
                ? t('programs.editor.sets', { count: item.sets.length })
                : summary}
            </span>
            {/* D-073: se conserva en la rutina, pero ya no sale en el buscador. */}
            {exercise?.isArchived === true ? (
              <span className={`${TAG} border-border text-muted border`}>
                {t('programs.editor.archived')}
              </span>
            ) : null}
          </span>
        </span>
        <span className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            aria-label={t('programs.editor.moveUp', { name })}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            aria-label={t('programs.editor.moveDown', { name })}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            aria-label={t('programs.editor.replace', { name })}
            disabled={exercise === undefined}
            onClick={onReplace}
          >
            ⇄
          </Button>
          <Button
            variant="ghost"
            aria-label={t('programs.editor.remove', { name })}
            onClick={() => (hasSetData(item) ? setIsConfirmingRemove(true) : onRemove())}
          >
            ✕
          </Button>
        </span>
      </div>

      {isConfirmingRemove ? (
        <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm">{t('programs.editor.removeConfirm', { name })}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRemove}>{t('programs.editor.removeYes')}</Button>
            <Button variant="ghost" onClick={() => setIsConfirmingRemove(false)}>
              {t('programs.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1">
        <Button
          variant="ghost"
          aria-label={t('programs.copy.duplicateExercise', { name })}
          onClick={onDuplicate}
        >
          {t('programs.copy.duplicate')}
        </Button>
        <Button
          variant="ghost"
          aria-label={t('programs.copy.copyExercise', { name })}
          onClick={onCopy}
        >
          {t('programs.copy.copy')}
        </Button>
      </div>

      {/* Hasta saber cómo se mide el ejercicio no se sabe qué pedir. */}
      {exercise === undefined ? null : (
        <PrescriptionEditor
          item={item}
          name={name}
          kind={targetKindOf(exercise.measurement)}
          scale={scale}
          unit={unit}
          isBodyweight={exercise.measurement === 'bodyweight_reps'}
          onChange={onPrescription}
        />
      )}

      {showNote ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={noteId} className="text-sm font-medium">
            {t('programs.editor.note', { name })}
          </label>
          <textarea
            id={noteId}
            maxLength={NOTE_MAX_LENGTH}
            value={item.note ?? ''}
            onChange={(event) => onNote(event.target.value)}
            className="bg-surface text-foreground border-border focus-visible:outline-primary-readable min-h-20 rounded-lg border px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <p className="text-muted text-sm">{t('programs.editor.noteHint')}</p>
        </div>
      ) : (
        <Button variant="ghost" className="self-start" onClick={() => setIsWritingNote(true)}>
          {t('programs.editor.addNote')}
        </Button>
      )}
    </li>
  );
}
