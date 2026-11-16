import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import type { ClientProfileTabProps } from '@/core/modules';
import { Card, ErrorState, Spinner, buttonClassName } from '@/core/ui';

import { useProgramsOfClient } from '../api/useAssignments';
import { routineProgress, routinesByClient } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import { localToday } from '../model/calendar';
import { CurrentProgramDays } from './CurrentProgramDays';
import { shortDate, useProgressText } from './useProgressText';

/**
 * La pestaña "Rutina" de la ficha de un cliente (PR 2.14, D-085): la vigente
 * con por dónde va y sus días, la próxima y las anteriores. Con el cliente
 * dado de baja se ven, sin acciones (D-083).
 */
export function ClientProgramTab({ clientId, isActive }: ClientProfileTabProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const programs = useProgramsOfClient(clientId);
  const progressText = useProgressText();

  if (programs.isPending) {
    return <Spinner />;
  }
  if (programs.isError) {
    return <ErrorState onRetry={() => void programs.refetch()} />;
  }

  const { current, next } = routinesByClient(programs.data, today).get(clientId) ?? {
    current: null,
    next: null,
  };
  const previous = programs.data
    .filter((program) => program.endedAt !== null)
    .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''));
  const progress = current === null ? null : routineProgress(current, today);
  const dates = (program: ClientProgram) =>
    t('programs.clientTab.startedOn', { date: shortDate(program.startsOn, language) });

  return (
    <div className="flex flex-col gap-4">
      {isActive ? null : (
        <p className="text-muted text-sm">{t('programs.clientTab.archivedClient')}</p>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('programs.clientTab.current')}</h2>
        {current === null ? (
          <p className="text-muted">{t('programs.clientTab.noProgram')}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium break-words">{current.name}</span>
                <span className="text-muted text-sm">
                  {[
                    progress === null ? null : progressText(progress),
                    t(`programs.assign.modes.${current.mode}`),
                    dates(current),
                  ]
                    .filter((part) => part !== null)
                    .join(' · ')}
                </span>
              </div>
              {isActive ? (
                <Link
                  to={`/coach/programs/${current.id}`}
                  className={buttonClassName('secondary')}
                  aria-label={t('programs.clientTab.editLabel', { name: current.name })}
                >
                  {t('programs.clientTab.edit')}
                </Link>
              ) : null}
            </div>
            <CurrentProgramDays program={current} today={today} />
          </>
        )}
      </Card>

      {next === null ? null : (
        <Card className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t('programs.clientTab.next')}</h2>
          <span className="font-medium break-words">{next.name}</span>
          <span className="text-muted text-sm">
            {t('programs.clientTab.startsOn', { date: shortDate(next.startsOn, language) })}
          </span>
        </Card>
      )}

      {previous.length === 0 ? null : (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t('programs.clientTab.previous')}</h2>
          <ul>
            {previous.map((program) => (
              <li key={program.id} className="border-border border-b py-2 last:border-b-0">
                <span className="font-medium break-words">{program.name}</span>
                <span className="text-muted block text-sm">
                  {t('programs.clientTab.previousDates', {
                    start: shortDate(program.startsOn, language),
                    end: shortDate((program.endedAt ?? '').slice(0, 10), language),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
