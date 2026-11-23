import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { Input } from '@/core/ui';

import { MAX_LAPS, blockLengthDays } from '../model/blocks-editor';
import { isWeekly } from '../model/cycle-editor';
import type { ProgramBlock } from '../model/program-document';

interface BlockDurationProps {
  block: ProgramBlock;
  /** Desde 1, para las etiquetas. */
  number: number;
  isLast: boolean;
  onLaps: (laps: number | null) => void;
}

const SHORTCUTS = [1, 2, 4] as const;

const CHIP = 'min-h-11 rounded-xl px-3 text-sm font-medium focus-ring';

/**
 * Cuánto dura un bloque (D-075): atajos de 1, 2 y 4 vueltas (semanas, si el
 * ciclo es semanal), las vueltas escritas (1 a 52) o, solo en el último, "Sin
 * fecha de fin". Dice cuántos días son.
 */
export function BlockDuration({ block, number, isLast, onLaps }: BlockDurationProps) {
  const { t } = useTranslation();
  // Lo que se está escribiendo y aún no vale (vacío, por ejemplo); si no, las vueltas del bloque.
  const [typed, setTyped] = useState<string | null>(null);
  const value = typed ?? (block.laps === null ? '' : String(block.laps));
  const unit = isWeekly(block) ? 'weeks' : 'laps';
  const days = blockLengthDays(block);

  const write = (text: string) => {
    const laps = Number(text);
    if (text.trim() !== '' && Number.isInteger(laps) && laps >= 1 && laps <= MAX_LAPS) {
      setTyped(null);
      onLaps(laps);
    } else {
      setTyped(text);
    }
  };

  const choose = (laps: number | null) => {
    setTyped(null);
    onLaps(laps);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-1.5 text-sm font-medium">
        {t('programs.blocks.duration', { number })}
      </legend>
      <div className="flex flex-wrap items-end gap-2">
        {SHORTCUTS.map((laps) => (
          <button
            key={laps}
            type="button"
            aria-pressed={block.laps === laps}
            onClick={() => choose(laps)}
            className={cn(
              CHIP,
              block.laps === laps ? 'bg-primary text-on-primary' : 'bg-background text-foreground',
            )}
          >
            {t(`programs.blocks.${unit}`, { count: laps })}
          </button>
        ))}
        {isLast ? (
          <button
            type="button"
            aria-pressed={block.laps === null}
            onClick={() => choose(null)}
            className={cn(
              CHIP,
              block.laps === null ? 'bg-primary text-on-primary' : 'bg-background text-foreground',
            )}
          >
            {t('programs.blocks.noEnd')}
          </button>
        ) : null}
        <Input
          label={t(`programs.blocks.${unit}Label`)}
          inputMode="numeric"
          className="w-24"
          value={value}
          onChange={(event) => write(event.target.value)}
        />
      </div>
      <p className="text-muted text-sm">
        {days === null ? t('programs.blocks.repeats') : t('programs.blocks.days', { count: days })}
      </p>
    </fieldset>
  );
}
