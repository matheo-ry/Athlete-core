import { cn } from '@/core/lib';

export interface ChoiceOption<K extends string> {
  key: K;
  label: string;
}

interface ChoiceChipsProps<K extends string> {
  /** Nombre del grupo para el lector de pantalla ("Periodo", "Métrica"…). */
  label: string;
  options: readonly ChoiceOption<K>[];
  value: K;
  onChange: (key: K) => void;
  testIdPrefix: string;
}

/**
 * Botones para elegir una opción (métrica, periodo, pestaña). min-h-11 = 44 px
 * de zona táctil (AGENTS §4) y aria-pressed para anunciar la elegida.
 */
export function ChoiceChips<K extends string>({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
}: ChoiceChipsProps<K>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              'min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-readable',
              active
                ? 'bg-primary text-on-primary'
                : 'border border-border bg-surface text-muted hover:text-foreground',
            )}
            data-testid={`${testIdPrefix}-${option.key}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
