import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';
import { Card, Icon } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
import type { ClientBlock } from '../model/client-view';
import { dayCounts } from '../model/cycle-editor';
import { useDayLabel, useDaySummary } from '../shared/useDayText';
import { shortDate } from '../shared/useProgressText';

interface BlockOverviewProps extends ClientBlock {
  program: ClientProgram;
  documentName: string;
}

/**
 * "Hoy toca" y los días del bloque en que va el cliente (D-084): el de hoy,
 * destacado con el color del coach; los de descanso, en segundo plano.
 */
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
    <div className="flex flex-col gap-5">
      <p className="text-muted -mt-3 text-lg">{documentName}</p>
      {todayDay === undefined ? null : todayDay.kind === 'rest' ? (
        <Card className="flex items-center gap-4">
          <span className="surface-raised text-muted flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <Icon name="moon" />
          </span>
          <p className="text-xl font-semibold tracking-tight">{t('programs.client.todayRest')}</p>
        </Card>
      ) : (
        <Card tone="accent" className="flex flex-col gap-2 p-5">
          <p className="eyebrow text-primary-readable">{t('programs.client.todayIs')}</p>
          <Link
            to={`?day=${String(todayDay.dayNumber)}`}
            className="focus-ring rounded-md text-2xl leading-tight font-semibold tracking-tight underline-offset-4 hover:underline"
          >
            {[label(todayDay.dayNumber), todayDay.name].filter((part) => part !== null).join(' · ')}
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
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow">
          {program.mode === 'list' ? t('programs.client.trainingDays') : t('programs.client.days')}
        </h2>
        <ul aria-label={t('programs.client.daysLabel')} className="flex flex-col gap-2">
          {days.map((day) => {
            const isToday = day.dayNumber === todayNumber;
            const isRest = day.kind === 'rest';
            return (
              <li key={day.dayNumber}>
                <Link
                  to={`?day=${String(day.dayNumber)}`}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(
                    'focus-ring group flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 transition-transform active:scale-[0.99]',
                    isToday ? 'surface-accent' : isRest ? 'bg-foreground/4' : 'surface',
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn('font-semibold', isRest && !isToday && 'text-muted')}>
                      {program.mode === 'list'
                        ? (day.name ?? t('programs.editor.day', { number: day.dayNumber }))
                        : label(day.dayNumber)}
                      {isToday ? (
                        <span className="sr-only">{` · ${t('programs.clientTab.today')}`}</span>
                      ) : null}
                    </span>
                    <span className="text-muted text-sm">{summary(day)}</span>
                  </span>
                  {isToday ? (
                    <span
                      aria-hidden="true"
                      className="bg-primary size-2 shrink-0 rounded-full shadow-[0_0_10px_var(--color-primary-glow)]"
                    />
                  ) : null}
                  {isRest ? (
                    <Icon name="moon" className="text-muted size-4 shrink-0" />
                  ) : (
                    <Icon
                      name="chevronRight"
                      className="text-muted size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {nextBlockStartsOn === null ? null : (
          <p className="text-muted text-sm">
            {t('programs.client.nextBlock', { date: shortDate(nextBlockStartsOn, language) })}
          </p>
        )}
      </section>
    </div>
  );
}
