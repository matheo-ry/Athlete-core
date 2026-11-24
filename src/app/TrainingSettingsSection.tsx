import { useTranslation } from 'react-i18next';

import { SAME_BUTTON_MODES, useProfile, useUpdateProfile } from '@/core/auth';
import type { ProfilePatch, SameButtonMode, UserProfile } from '@/core/auth';
import { cn } from '@/core/lib';
import { Card, ErrorState, Spinner } from '@/core/ui';

/** Descansos que se ofrecen (en segundos); el actual se añade si es otro. */
const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

const SAME_LABEL_KEYS: Record<SameButtonMode, string> = {
  previous: 'app.training.samePrevious',
  previous_then_today: 'app.training.sameToday',
};

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Perfil → "Entreno" (D-120 y D-123): descanso por defecto, arrancar el
 * descanso solo, sonido, vibración y qué copia "Igual". Se guardan al momento
 * en el perfil y valen en todos sus espacios.
 */
export function TrainingSettingsSection() {
  const { t } = useTranslation();
  const profile = useProfile();
  const update = useUpdateProfile();
  const failure = update.data?.ok === false ? update.data.reason : null;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('app.training.title')}</h2>
        {profile.isPending ? <Spinner /> : null}
        {profile.isError ? <ErrorState onRetry={() => void profile.refetch()} /> : null}
        {profile.data === undefined ? null : (
          <Settings
            profile={profile.data}
            onChange={(patch) => {
              update.mutate(patch);
            }}
          />
        )}
        {failure === null ? null : (
          <p role="alert" className="text-danger text-sm font-medium">
            {t(failure === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected')}
          </p>
        )}
      </div>
    </Card>
  );
}

function Settings({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (patch: ProfilePatch) => void;
}) {
  const { t } = useTranslation();
  const options = REST_OPTIONS.includes(profile.defaultRestSeconds)
    ? REST_OPTIONS
    : [...REST_OPTIONS, profile.defaultRestSeconds].sort((a, b) => a - b);

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('app.training.defaultRest')}</span>
        <select
          className="bg-background border-border-strong focus-ring min-h-12 rounded-xl border px-4 text-base"
          value={profile.defaultRestSeconds}
          onChange={(event) => {
            onChange({ defaultRestSeconds: Number(event.target.value) });
          }}
        >
          {options.map((seconds) => (
            <option key={seconds} value={seconds}>
              {clock(seconds)}
            </option>
          ))}
        </select>
      </label>
      <Toggle
        label={t('app.training.autostart')}
        value={profile.restAutostart}
        onChange={(restAutostart) => {
          onChange({ restAutostart });
        }}
      />
      <Toggle
        label={t('app.training.sound')}
        value={profile.restSound}
        onChange={(restSound) => {
          onChange({ restSound });
        }}
      />
      <Toggle
        label={t('app.training.vibration')}
        value={profile.restVibration}
        onChange={(restVibration) => {
          onChange({ restVibration });
        }}
      />
      <Toggle
        label={t('app.training.warmupSets')}
        value={profile.warmupSetsEnabled}
        onChange={(warmupSetsEnabled) => {
          onChange({ warmupSetsEnabled });
        }}
      />
      <div role="group" aria-label={t('app.training.sameLabel')} className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('app.training.sameLabel')}</span>
        <div className="bg-foreground/6 grid gap-1 rounded-2xl p-1">
          {SAME_BUTTON_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={profile.sameButton === mode}
              onClick={() => {
                onChange({ sameButton: mode });
              }}
              className={cn(
                'focus-ring min-h-11 rounded-xl px-4 text-left text-sm font-semibold transition-colors',
                profile.sameButton === mode
                  ? 'bg-primary text-on-primary'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {t(SAME_LABEL_KEYS[mode])}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => {
        onChange(!value);
      }}
      className="focus-ring flex min-h-11 items-center justify-between gap-3 rounded-lg text-left text-sm font-medium"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
          value ? 'bg-primary' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'bg-raised absolute top-0.5 left-0.5 size-6 rounded-full shadow-md transition-transform duration-200 ease-[var(--ease-spring)]',
            value && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}
