import { useTranslation } from 'react-i18next';

import { SEGMENTED_GROUP_CLASS, segmentClassName } from '@/core/ui';

import type { BrandMode } from '@/core/branding';

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
      <div className={SEGMENTED_GROUP_CLASS}>
        {MODES.map(({ mode, labelKey }) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={segmentClassName(value === mode)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
