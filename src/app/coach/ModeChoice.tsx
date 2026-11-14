import { useTranslation } from 'react-i18next';

import type { BrandMode } from '@/core/branding';
import { cn } from '@/core/lib';

interface ModeChoiceProps {
  value: BrandMode;
  onChange: (mode: BrandMode) => void;
}

const MODES: readonly { mode: BrandMode; labelKey: string }[] = [
  { mode: 'dark', labelKey: 'app.brand.modeDark' },
  { mode: 'light', labelKey: 'app.brand.modeLight' },
];

/** Claro u oscuro: lo elige el coach para sus clientes (D-057). */
export function ModeChoice({ value, onChange }: ModeChoiceProps) {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t('app.brand.modeLabel')} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t('app.brand.modeLabel')}</span>
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ mode, labelKey }) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={cn(
              'min-h-11 rounded-lg px-4 text-sm font-medium',
              'focus-visible:outline-primary-readable focus-visible:outline-2',
              value === mode ? 'bg-primary text-on-primary' : 'bg-surface text-muted',
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
