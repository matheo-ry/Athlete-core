import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';
import { Card } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
import { dayExecutionStatus } from '../model/client-view';
import type { ClientBlock } from '../model/client-view';
import { dayCounts } from '../model/cycle-editor';
import { useDayLabel, useDaySummary } from '../shared/useDayText';
import { shortDate } from '../shared/useProgressText';

interface BlockOverviewProps extends ClientBlock {
  program: ClientProgram;
  documentName: string;
}

/** "Hoy toca" y los días del bloque en que va el cliente (D-084). */
export function BlockOverview({
  program,
  documentName,
  block,
  todayNumber,
  nextBlockStartsOn,
  isRecovery,
}: BlockOverviewProps) {
  const language = useLanguage();
  const { t } = useTranslation();
  const label = useDayLabel(block);
  const summary = useDaySummary();
  const todayDay = block.days.find((day) => day.dayNumber === todayNumber);
  const days =
    program.mode === 'list' ? block.days.filter((day) => day.kind === 'training') : block.days;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">{documentName}</p>
      {todayDay === undefined ? null : (
        <Card className="flex flex-col gap-1">
          {todayDay.kind === 'rest' ? (
            <p className="text-lg font-semibold">{t('programs.client.todayRest')}</p>
          ) : (
            <>
              <p className="text-muted text-sm">{t('programs.client.todayIs')}</p>
              <Link
                to={`?day=${String(todayDay.dayNumber)}`}
                className="focus-visible:outline-primary-readable rounded text-lg font-semibold underline-offset-4 hover:underline focus-visible:outline-2"
              >
                {[label(todayDay.dayNumber), todayDay.name]
                  .filter((part) => part !== null)
                  .join(' · ')}
                {isRecovery ? ` ${t('programs.client.recoverSuffix')}` : null}
              </Link>
              <p className="text-sm">
                {[
                  todayDay.subtitle,
                  todayDay.place,
                  t('programs.editor.exercises', { count: dayCounts(todayDay).exercises }),
                  t('programs.editor.sets', { count: dayCounts(todayDay).sets }),
                ]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </p>
            </>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-semibold">
          {program.mode === 'list' ? t('programs.client.trainingDays') : t('programs.client.days')}
        </h2>
        <ul aria-label={t('programs.client.daysLabel')}>
          {days.map((day) => {
            const status =
              program.mode === 'calendar'
                ? dayExecutionStatus(day, program, language)
                : { kind: 'normal' as const };
            const baseLabel =
              program.mode === 'list'
                ? (day.name ?? t('programs.editor.day', { number: day.dayNumber }))
                : label(day.dayNumber);
            const titleText =
              status.kind === 'done_other_day'
                ? t('programs.client.doneOnWeekday', { name: baseLabel, weekday: status.weekday })
                : baseLabel;

            return (
              <li key={day.dayNumber} className="border-border border-b last:border-b-0">
                <Link
                  to={`?day=${String(day.dayNumber)}`}
                  aria-current={day.dayNumber === todayNumber ? 'date' : undefined}
                  className={cn(
                    'flex min-h-14 flex-col justify-center rounded-lg px-2 py-2',
                    'hover:bg-background focus-visible:outline-primary-readable focus-visible:outline-2',
                    day.dayNumber === todayNumber ? 'bg-background' : null,
                  )}
                >
                  <span className="font-medium">
                    {titleText}
                    {day.dayNumber === todayNumber ? ` · ${t('programs.clientTab.today')}` : null}
                    {status.kind === 'missed' ? ` · ${t('programs.client.missed')}` : null}
                  </span>
                  <span className={cn('text-sm', day.kind === 'rest' ? 'text-muted' : null)}>
                    {summary(day)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {nextBlockStartsOn === null ? null : (
          <p className="text-muted mt-3 text-sm">
            {t('programs.client.nextBlock', { date: shortDate(nextBlockStartsOn, language) })}
          </p>
        )}
      </Card>
    </div>
  );
}
