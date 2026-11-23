import { SEGMENTED_GROUP_CLASS, segmentClassName } from '@/core/ui';

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
 * Botones para elegir una opción (métrica, periodo, pestaña), como control
 * segmentado de cristal (D-prime2-2). min-h-11 = 44 px de zona táctil (AGENTS §4)
 * y aria-pressed para anunciar la elegida.
 */
export function ChoiceChips<K extends string>({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
}: ChoiceChipsProps<K>) {
  return (
    <div className={SEGMENTED_GROUP_CLASS} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={segmentClassName(active, 'px-3.5')}
            data-testid={`${testIdPrefix}-${option.key}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
