import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';
import { Card, ROW_LINK_CLASS, SECTION_TITLE_CLASS, enterDelay } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
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
      <p className="eyebrow text-muted -mt-2">{documentName}</p>
      {todayDay === undefined ? null : (
        <Card
          className="animate-enter relative flex flex-col gap-2 overflow-hidden"
          style={enterDelay(60)}
        >
          {/* Una franja de luz del color del coach: hoy es lo primero que se mira. */}
          <span
            aria-hidden="true"
            className="bg-primary absolute inset-y-5 left-0 w-1 rounded-r-full shadow-[0_0_16px_2px_var(--color-primary-glow)]"
          />
          {todayDay.kind === 'rest' ? (
            <p className="display text-3xl">{t('programs.client.todayRest')}</p>
          ) : (
            <>
              <p className="eyebrow text-primary-readable">{t('programs.client.todayIs')}</p>
              <Link
                to={`?day=${String(todayDay.dayNumber)}`}
                className="focus-ring display rounded-md text-[2.2rem] underline-offset-[6px] decoration-2 hover:underline"
              >
                {[label(todayDay.dayNumber), todayDay.name]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Link>
              <p className="text-muted text-sm">
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

      <Card className="animate-enter flex flex-col gap-3 p-3 pt-5" style={enterDelay(120)}>
        <h2 className={`${SECTION_TITLE_CLASS} px-2`}>
          {program.mode === 'list' ? t('programs.client.trainingDays') : t('programs.client.days')}
        </h2>
        <ul aria-label={t('programs.client.daysLabel')} className="flex flex-col">
          {days.map((day, index) => {
            const isToday = day.dayNumber === todayNumber;
            return (
              <li key={day.dayNumber}>
                <Link
                  to={`?day=${String(day.dayNumber)}`}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(ROW_LINK_CLASS, isToday && 'bg-primary-soft hover:bg-primary-soft')}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'numeral flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg',
                      isToday
                        ? 'bg-primary text-on-primary shadow-[0_8px_20px_-10px_var(--color-primary-glow)]'
                        : day.kind === 'rest'
                          ? 'text-muted shadow-[inset_0_0_0_1px_var(--color-hairline)]'
                          : 'bg-glass-strong',
                    )}
                  >
                    {program.mode === 'list' ? index + 1 : day.dayNumber}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">
                      {program.mode === 'list'
                        ? (day.name ?? t('programs.editor.day', { number: day.dayNumber }))
                        : label(day.dayNumber)}
                      {isToday ? ` · ${t('programs.clientTab.today')}` : null}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        day.kind === 'rest' ? 'text-muted' : 'text-foreground/75',
                      )}
                    >
                      {summary(day)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {nextBlockStartsOn === null ? null : (
          <p className="text-muted px-2 pb-2 text-sm">
            {t('programs.client.nextBlock', { date: shortDate(nextBlockStartsOn, language) })}
          </p>
        )}
      </Card>
    </div>
  );
}
