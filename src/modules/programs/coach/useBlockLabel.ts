import { useTranslation } from 'react-i18next';

import { isWeekly } from '../model/cycle-editor';
import type { ProgramBlock } from '../model/program-document';

/** Cómo se nombra un bloque y su duración en una línea (PR 2.16). */
export function useBlockLabel() {
  const { t } = useTranslation();
  return {
    /** "Bloque 2" o, si tiene nombre, "Bloque 2 · Descarga". */
    name: (block: ProgramBlock, index: number) =>
      block.name === null
        ? t('programs.blocks.block', { number: index + 1 })
        : t('programs.blocks.namedBlock', { number: index + 1, name: block.name }),
    /** "4 semanas", "2 vueltas" o "Sin fecha de fin". */
    duration: (block: ProgramBlock) =>
      block.laps === null
        ? t('programs.blocks.noEnd')
        : t(`programs.blocks.${isWeekly(block) ? 'weeks' : 'laps'}`, { count: block.laps }),
  };
}
