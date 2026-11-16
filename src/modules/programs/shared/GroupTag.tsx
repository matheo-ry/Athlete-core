import { useTranslation } from 'react-i18next';

import type { GroupInfo } from '../model/supersets';

/**
 * La marca "Superserie" o "Circuito" de un ejercicio agrupado, con su puesto
 * en el grupo (PR 2.17, D-077). Sin grupo no pinta nada.
 */
export function GroupTag({ group }: { group: GroupInfo | null }) {
  const { t } = useTranslation();
  if (group === null) {
    return null;
  }
  return (
    <span className="bg-primary text-on-primary self-start rounded-full px-2 py-0.5 text-xs font-semibold">
      {t(`programs.supersets.${group.kind}`)} ·{' '}
      {t('programs.supersets.position', { position: group.position, size: group.size })}
    </span>
  );
}
