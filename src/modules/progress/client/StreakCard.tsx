import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAuth } from '@/core/auth';
import { cn } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';
import { Card, Icon, Spinner, buttonClassName } from '@/core/ui';

import { useClientProgress } from '../api/useClientProgress';
import { calculateMotivation } from '../model/motivation';

/**
 * Tarjeta de racha semanal en el inicio del cliente (PR 3.17, D-130).
 * Muestra las semanas completas seguidas y el tracker de lunes a domingo.
 * Si el coach desactiva los logros, no se muestra nada (AC4).
 */
export function StreakCard() {
  const { t } = useTranslation();
  const { achievementsEnabled } = useTenantSettings();
  const { user } = useAuth();
  const clientId = user?.id ?? null;
  const progress = useClientProgress(clientId);

  const motivation = useMemo(
    () => calculateMotivation({ rawWorkouts: progress.rawWorkouts }),
    [progress.rawWorkouts],
  );

  if (!achievementsEnabled) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-4" data-testid="streak-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <Icon name="flame" className="size-5" />
          </div>
          <h2 className="eyebrow">{t('progress.motivation.streakTitle')}</h2>
        </div>
        <span
          className="numeric flex items-center gap-1 text-base font-bold text-amber-500"
          data-testid="streak-count"
        >
          {motivation.currentStreak}{' '}
          <span className="text-xs font-semibold">
            {t('progress.motivation.streakWeeks', { count: motivation.currentStreak })}
          </span>
        </span>
      </div>

      {progress.isPending ? (
        <Spinner />
      ) : progress.isError ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted text-sm">{t('core.errors.unexpected')}</p>
          <button
            type="button"
            className={buttonClassName('secondary')}
            onClick={() => void progress.refetch()}
          >
            {t('core.ui.retry')}
          </button>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm" data-testid="streak-subtitle">
            {motivation.currentStreak === 0 && motivation.weekTracker.completedDays === 0
              ? t('progress.motivation.noStreak')
              : t('progress.motivation.weekProgress', {
                  done: motivation.weekTracker.completedDays,
                  target: motivation.weekTracker.targetDays,
                })}
          </p>

          <div
            className="grid grid-cols-7 gap-1.5 pt-1"
            role="group"
            aria-label={t('progress.motivation.streakTitle')}
            data-testid="week-tracker"
          >
            {motivation.weekTracker.days.map((day) => {
              const letter = t(`progress.motivation.weekTracker.${day.dayKey}`);
              const statusText = day.isDone
                ? t('progress.motivation.weekTracker.done')
                : day.isToday
                  ? t('progress.motivation.weekTracker.today')
                  : t('progress.motivation.weekTracker.pending');

              return (
                <div key={day.dayIndex} className="flex flex-col items-center gap-1">
                  <span className="text-muted text-xs font-semibold">{letter}</span>
                  <div
                    aria-label={`${letter}: ${statusText}`}
                    data-testid={`tracker-day-${String(day.dayIndex)}`}
                    data-done={day.isDone}
                    data-today={day.isToday}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                      day.isDone
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-foreground/5 text-muted',
                      day.isToday &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background font-black',
                    )}
                  >
                    {day.isDone ? <Icon name="check" className="size-4" /> : letter}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Link
        to="/client/progress?tab=achievements"
        className={buttonClassName('secondary', 'w-full mt-1')}
        data-testid="view-achievements-link"
      >
        <Icon name="award" className="size-4 shrink-0" />
        <span>{t('progress.motivation.viewAchievements')}</span>
      </Link>
    </Card>
  );
}
