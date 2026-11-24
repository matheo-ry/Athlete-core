import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Icon, Pill } from '@/core/ui';
import { useClientHealthData } from '@/modules/workouts';

import type { RawWorkout } from '../model/exercise-history';
import { calculateMotivation } from '../model/motivation';

export interface AchievementsSectionProps {
  clientId: string | null;
  rawWorkouts: RawWorkout[];
}

/**
 * Sección de Logros y Niveles (PR 3.17, D-130).
 * Muestra el nivel actual (1-7), la barra de progreso al siguiente nivel
 * y el catálogo de los 18 logros con su estado desbloqueado o bloqueado.
 */
export function AchievementsSection({ clientId, rawWorkouts }: AchievementsSectionProps) {
  const { t } = useTranslation();
  const healthQuery = useClientHealthData(clientId);
  const bodyWeightsCount = healthQuery.data?.weights.length ?? 0;

  const motivation = useMemo(
    () => calculateMotivation({ rawWorkouts, bodyWeightsCount }),
    [rawWorkouts, bodyWeightsCount],
  );

  const { level, achievements } = motivation;
  const levelName = t(`progress.motivation.levels.${level.key}`);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="flex flex-col gap-6" data-testid="achievements-section">
      {/* Tarjeta de Nivel */}
      <Card className="flex flex-col gap-4" data-testid="level-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon name="award" className="size-6" />
            </div>
            <div className="flex flex-col">
              <span className="eyebrow">{t('progress.motivation.achievementsTitle')}</span>
              <h2 className="text-xl font-bold" data-testid="level-title">
                {t('progress.motivation.levelTitle', { level: level.level, name: levelName })}
              </h2>
            </div>
          </div>
          <span className="numeric text-sm font-semibold text-muted">
            {t('progress.motivation.levelWorkouts', { count: level.totalWorkouts })}
          </span>
        </div>

        {level.nextLevelWorkouts !== null ? (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium text-muted">
              <span>
                {t('progress.motivation.levelProgress', {
                  done: level.totalWorkouts,
                  target: level.nextLevelWorkouts,
                  next: level.level + 1,
                })}
              </span>
              <span>{Math.round(level.progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${String(level.progress * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs font-semibold text-primary">{t('progress.motivation.maxLevel')}</p>
        )}
      </Card>

      {/* Grid de 18 Logros */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('progress.motivation.achievementsTitle')}</h3>
          <span className="text-sm font-medium text-muted" data-testid="achievements-count">
            {t('progress.motivation.achievementsCount', {
              unlocked: unlockedCount,
              total: achievements.length,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => {
            const title = t(`progress.motivation.items.${ach.id}.title`);
            const description = t(`progress.motivation.items.${ach.id}.description`);

            return (
              <Card
                key={ach.id}
                className="flex flex-col justify-between gap-3 p-4 transition-all"
                data-testid={`achievement-${ach.id}`}
                data-unlocked={ach.isUnlocked}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={
                      ach.isUnlocked
                        ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm'
                        : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-muted'
                    }
                  >
                    <Icon name={ach.isUnlocked ? ach.icon : 'lock'} className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h4 className="truncate text-sm font-semibold">{title}</h4>
                    <p className="text-muted line-clamp-2 text-xs leading-4">{description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                  {ach.isUnlocked ? (
                    <Pill tone="primary">{t('progress.motivation.unlocked')}</Pill>
                  ) : (
                    <Pill tone="neutral">{t('progress.motivation.locked')}</Pill>
                  )}

                  {ach.target > 1 && !ach.isUnlocked ? (
                    <span className="numeric text-muted">
                      {t('progress.motivation.progressLabel', {
                        current: ach.current,
                        target: ach.target,
                      })}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
