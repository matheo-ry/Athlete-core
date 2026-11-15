import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { cn, logger } from '@/core/lib';
import { Button, Card } from '@/core/ui';

import { useSaveProgram } from '../api/useProgram';
import { editCycle, firstBlock, isDirty } from '../model/cycle-editor';
import type { ProgramDocument } from '../model/program-document';
import { CycleControl } from './CycleControl';
import { DayList } from './DayList';
import { DayPanel } from './DayPanel';
import { useDayLabel } from './useDayText';

const FAILURES = {
  offline: 'core.errors.offline',
  limit_reached: 'programs.form.limitReached',
  error: 'core.errors.unexpected',
} as const;

interface ProgramEditorProps {
  /** La rutina tal como está guardada. */
  saved: ProgramDocument;
  /** Con el `updated_at` de lo recién guardado. */
  onSaved: (updatedAt: string) => void;
  onReload: () => void;
}

/**
 * El editor de una rutina (PR 2.8): los días del ciclo del primer bloque.
 * Los cambios se quedan en la pantalla hasta "Guardar cambios", que guarda
 * todo de una vez (D-079). El día abierto va en la dirección (`?day=3`): en
 * el móvil, "Atrás" vuelve a la lista de días.
 */
export function ProgramEditor({ saved, onSaved, onReload }: ProgramEditorProps) {
  const { t } = useTranslation();
  const [draft, dispatch] = useReducer(editCycle, saved);
  const save = useSaveProgram(saved.id ?? '');
  const [failure, setFailure] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const block = firstBlock(draft);
  const label = useDayLabel(block ?? { id: null, name: null, cycleDays: 1, laps: null, days: [] });
  const dirty = isDirty(saved, draft);

  if (block === undefined) {
    return null;
  }
  const requested = Number(searchParams.get('day'));
  const openDay = block.days.find((day) => day.dayNumber === requested) ?? null;
  // En escritorio siempre hay un día abierto: el primero si no se ha elegido.
  const shownDay = openDay ?? block.days[0];

  const submit = () => {
    setFailure(null);
    save
      .mutateAsync(draft)
      .then((result) => {
        if (result.status === 'saved') {
          onSaved(result.updatedAt);
        } else if (result.status === 'conflict') {
          setIsConflict(true);
        } else {
          setFailure(t(FAILURES[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not save program', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!dirty || save.isPending}>
          {t('programs.editor.save')}
        </Button>
        {dirty ? <p className="text-muted text-sm">{t('programs.editor.unsaved')}</p> : null}
      </div>
      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      ) : null}
      {isConflict ? (
        // D-079: no se pisa lo guardado desde otro dispositivo.
        <div role="alert" className="border-danger flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm font-medium">{t('programs.editor.conflict')}</p>
          <div>
            <Button variant="secondary" onClick={onReload}>
              {t('programs.editor.reload')}
            </Button>
          </div>
        </div>
      ) : null}

      <Card>
        <CycleControl block={block} onChange={dispatch} />
      </Card>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6">
        <Card className={cn(openDay !== null && 'hidden lg:block')}>
          <DayList
            block={block}
            selectedDay={shownDay?.dayNumber ?? null}
            onSelect={(dayNumber) => setSearchParams({ day: String(dayNumber) })}
          />
        </Card>
        {shownDay !== undefined ? (
          <Card className={cn('flex flex-col gap-4', openDay === null && 'hidden lg:flex')}>
            <Button
              variant="ghost"
              className="self-start lg:hidden"
              onClick={() => setSearchParams({})}
            >
              {t('programs.editor.backToDays')}
            </Button>
            <DayPanel
              key={shownDay.dayNumber}
              day={shownDay}
              label={label(shownDay.dayNumber)}
              onChange={dispatch}
            />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
