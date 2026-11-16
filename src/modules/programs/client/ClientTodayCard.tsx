import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { Card } from '@/core/ui';

import { useClientPrograms } from '../api/useAssignments';
import { useProgram } from '../api/useProgram';
import { routinesByClient } from '../model/assignments';
import { localToday } from '../model/calendar';
import { clientBlock } from '../model/client-view';
import { useDayLabel, useDaySummary } from '../shared/useDayText';
import { shortDate } from '../shared/useProgressText';

const LINK =
  'focus-visible:outline-primary-readable rounded text-lg font-semibold underline-offset-4 hover:underline focus-visible:outline-2';

/**
 * La tarjeta del inicio del cliente (PR 2.18, D-084): "Hoy toca", "Hoy:
 * descanso" o el estado de su rutina (sin rutina, o cuándo empieza). Lleva a
 * "Entreno".
 */
export function ClientTodayCard() {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const programs = useClientPrograms();
  // El cliente solo lee sus propias rutinas (RLS): hay como mucho un cliente.
  const routines = [...routinesByClient(programs.data ?? [], today).values()][0];
  const current = routines?.current ?? null;
  const next = routines?.next ?? null;
  const document = useProgram(current?.id ?? '');
  const block =
    current === null || document.data === undefined
      ? null
      : clientBlock(current, document.data, today);
  const label = useDayLabel(block?.block);
  const summary = useDaySummary();

  if (!programs.isSuccess || (current !== null && !document.isSuccess)) {
    return null;
  }
  if (current === null) {
    return (
      <Card>
        <p className="font-semibold">
          {next === null
            ? t('programs.client.noProgram')
            : t('programs.client.startsOn', { date: shortDate(next.startsOn, language) })}
        </p>
      </Card>
    );
  }
  const todayDay = block?.block.days.find((day) => day.dayNumber === block.todayNumber);

  return (
    <Card className="flex flex-col gap-1">
      {todayDay === undefined ? (
        // Modo lista: sin "Hoy toca" (D-082).
        <>
          <p className="text-muted text-sm">{t('programs.home.listProgram')}</p>
          <Link to="/client/program" className={LINK}>
            {current.name}
          </Link>
        </>
      ) : todayDay.kind === 'rest' ? (
        <>
          <p className="text-lg font-semibold">{t('programs.home.todayRest')}</p>
          <Link to="/client/program" className={LINK}>
            {t('programs.home.open')}
          </Link>
        </>
      ) : (
        <>
          <p className="text-muted text-sm">{t('programs.home.todayTitle')}</p>
          <Link to={`/client/program?day=${String(todayDay.dayNumber)}`} className={LINK}>
            {[label(todayDay.dayNumber), todayDay.name].filter((part) => part !== null).join(' · ')}
          </Link>
          <p className="text-sm">{summary({ ...todayDay, name: null })}</p>
        </>
      )}
    </Card>
  );
}
