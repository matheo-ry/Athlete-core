import { useTranslation } from 'react-i18next';

import { BRAND_PALETTE, normalizeHexColor, pickReadableOn } from '@/core/branding';
import { cn } from '@/core/lib';
import { Icon, Input } from '@/core/ui';

interface ColorChoiceProps {
  /** Para distinguir los campos de cada color (principal o acento). */
  name: 'primary' | 'accent';
  legend: string;
  customLabel: string;
  /** Lo escrito, tal cual: puede no ser un color todavía. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Elegir un color de la marca (D-057): uno de los 12 de la paleta con un toque,
 * o uno propio, escrito (#1E5BD8) o con el selector del sistema.
 */
export function ColorChoice({
  name,
  legend,
  customLabel,
  value,
  onChange,
  error,
}: ColorChoiceProps) {
  const { t } = useTranslation();
  const current = normalizeHexColor(value);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="grid max-w-sm grid-cols-6 gap-2">
        {BRAND_PALETTE.map((color) => (
          <button
            key={color.key}
            type="button"
            aria-label={t(`app.brand.palette.${color.key}`)}
            aria-pressed={current === color.hex}
            onClick={() => onChange(color.hex)}
            style={{ backgroundColor: color.hex, color: pickReadableOn(color.hex) }}
            className={cn(
              'flex aspect-square min-h-11 items-center justify-center rounded-full text-base font-semibold',
              'shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] transition-transform hover:scale-105',
              'focus-ring',
              current === color.hex
                ? 'ring-foreground ring-offset-surface ring-2 ring-offset-2'
                : '',
            )}
          >
            {current === color.hex ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
      <details
        className="group flex flex-col gap-3"
        open={current === null || !BRAND_PALETTE.some((color) => color.hex === current)}
      >
        <summary className="focus-ring text-primary-readable flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full text-sm font-semibold">
          <Icon name="chevronRight" className="size-4 transition-transform group-open:rotate-90" />
          {t('app.brand.moreColors')}
        </summary>
        <div className="flex flex-col gap-3 pt-1">
          <Input
            label={customLabel}
            hint={t('app.brand.customHint')}
            name={`brand-${name}`}
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            error={error}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="color"
              value={(current ?? '#000000').toLowerCase()}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              className="border-border-strong h-11 w-14 shrink-0 cursor-pointer rounded-xl border"
            />
            {t('app.brand.pickerLabel')}
          </label>
        </div>
      </details>
    </fieldset>
  );
}
