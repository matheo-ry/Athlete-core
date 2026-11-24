import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';
import { Icon } from '@/core/ui';

import type {
  ActiveExercise,
  ActiveSet,
  PreviousSetValues,
  SetPatch,
  Side,
} from '../model/active-workout';
import { isMiniAchievement } from '../model/minilogros';
import { SetSideFields, previousText } from './SetSideFields';

/** Lo de cada lado de una serie: un solo valor sin lado, o derecha e izquierda. */
export type BySide<T> = Partial<Record<Side, T | null>>;

interface SetEditorProps {
  exercise: ActiveExercise;
  /** Las filas de esta serie: una, o derecha e izquierda en un unilateral (D-121). */
  sets: readonly ActiveSet[];
  /** Lo de la vez anterior en esta serie (D-120); `null` si no hay. */
  previous: BySide<PreviousSetValues>;
  /** Lo que copia "Igual" según el ajuste del Perfil; `null` si no hay nada que copiar. */
  copySource: BySide<PreviousSetValues>;
  onChange: (side: Side, patch: SetPatch) => void;
  /** "Igual": copia lo gris, los dos lados si los hay. */
  onCopy: () => void;
  /** Tocar la serie iluminada la apaga, con sus dos lados. */
  onUnmark: () => void;
}

/**
 * Una serie (D-120): su título con "Igual" y los datos de cada lado. En un
 * unilateral hay dos bloques, "Derecha" e "Izquierda", cada uno con su peso,
 * repeticiones e intensidad; la serie queda iluminada cuando están los dos
 * (D-121).
 */
export function SetEditor({
  exercise,
  sets,
  previous,
  copySource,
  onChange,
  onCopy,
  onUnmark,
}: SetEditorProps) {
  const { t } = useTranslation();
  const { achievementsEnabled } = useTenantSettings();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const number = sets[0]?.setNumber ?? 1;
  const isDone = sets.length > 0 && sets.every((set) => set.isDone);
  const hasSides = sets.some((set) => set.side !== 'none');
  const canCopy = sets.some((set) => (copySource[set.side] ?? null) !== null);
  const hasMiniAchievement =
    achievementsEnabled &&
    sets.some((set) => set.isDone && isMiniAchievement(set, previous[set.side] ?? null));
  const grey = (side: Side) => {
    const values = previous[side] ?? null;
    return values === null ? null : (
      <span className="text-muted flex min-w-0 items-center gap-1.5">
        <Icon name="history" className="size-3.5 shrink-0" />
        <span className="numeric truncate text-sm" data-testid="previous">
          {previousText(values, exercise.measurement, unit, t('workouts.set.failureShort'))}
        </span>
      </span>
    );
  };

  return (
    <li
      aria-label={t('workouts.set.label', { number })}
      data-done={isDone}
      className={cn(
        'flex flex-col gap-3 rounded-3xl p-3 transition-[background,border-color,box-shadow] duration-300',
        isDone ? 'surface-accent' : 'surface',
      )}
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <button
          type="button"
          className="focus-ring flex min-h-11 items-center gap-2.5 rounded-full pr-2 text-left text-sm font-semibold"
          aria-pressed={isDone}
          disabled={!sets.some((set) => set.isDone)}
          aria-label={t('workouts.set.unmark', { number })}
          onClick={onUnmark}
        >
          <span
            aria-hidden="true"
            className={cn(
              'numeric flex size-9 items-center justify-center rounded-full text-sm transition-colors duration-300',
              isDone
                ? 'bg-primary text-on-primary shadow-[0_6px_18px_-6px_var(--color-primary-glow)]'
                : 'bg-foreground/8 text-muted',
            )}
          >
            {isDone ? <Icon name="check" className="size-4" /> : number}
          </span>
          {t('workouts.set.label', { number })}
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {hasMiniAchievement ? (
            <span
              data-testid="minilogro-badge"
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500 animate-pulse"
            >
              <Icon name="sparkles" className="size-3.5" />
              {t('workouts.set.miniAchievement')}
            </span>
          ) : null}
          {hasSides ? null : grey('none')}
          {canCopy ? (
            <button
              type="button"
              className="focus-ring surface-raised hover:border-border-strong min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-transform active:scale-95"
              onClick={onCopy}
            >
              {t('workouts.set.same')}
            </button>
          ) : null}
        </div>
      </div>
      {sets.map((set) =>
        set.side === 'none' ? (
          <SetSideFields
            key={set.id}
            exercise={exercise}
            set={set}
            previous={previous.none ?? null}
            onChange={(patch) => {
              onChange('none', patch);
            }}
          />
        ) : (
          <div
            key={set.id}
            role="group"
            aria-label={t(`workouts.set.side.${set.side}`)}
            data-done={set.isDone}
            className={cn(
              'flex flex-col gap-2 rounded-2xl p-2 transition-colors duration-300',
              set.isDone ? 'bg-primary/10' : 'bg-foreground/5',
            )}
          >
            <div className="flex min-h-9 items-center justify-between gap-2 px-1">
              <p className="eyebrow">{t(`workouts.set.side.${set.side}`)}</p>
              {grey(set.side)}
            </div>
            <SetSideFields
              exercise={exercise}
              set={set}
              previous={previous[set.side] ?? null}
              onChange={(patch) => {
                onChange(set.side, patch);
              }}
            />
          </div>
        ),
      )}
    </li>
  );
}
