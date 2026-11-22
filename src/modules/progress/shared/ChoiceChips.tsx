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
 * Control segmentado para elegir una opción (métrica, periodo, pestaña): una
 * píldora hundida con la elegida encendida; si no caben, se desliza de lado. min-h-11 = 44 px de zona táctil
 * (AGENTS §4) y aria-pressed para anunciar la elegida.
 */
export function ChoiceChips<K extends string>({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
}: ChoiceChipsProps<K>) {
  return (
    <div
      className="bg-foreground/6 no-scrollbar inline-flex max-w-full items-center gap-0.5 self-start overflow-x-auto rounded-full p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              'focus-visible:outline-primary-readable min-h-11 shrink-0 focus-visible:outline-2 focus-visible:-outline-offset-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200',
              active
                ? 'bg-primary text-on-primary shadow-[0_6px_16px_-8px_var(--color-primary-glow)]'
                : 'text-muted hover:text-foreground',
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
