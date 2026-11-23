import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';

interface RecoverDraftProps {
  onRecover: () => void;
  onDiscard: () => void;
}

/** Al abrir una rutina con cambios que quedaron sin guardar en este dispositivo (PR 2.8b). */
export function RecoverDraft({ onRecover, onDiscard }: RecoverDraftProps) {
  const { t } = useTranslation();

  return (
    <div
      role="region"
      aria-label={t('programs.editor.recoverTitle')}
      className="border-primary flex flex-col gap-2 rounded-xl border-2 p-3"
    >
      <p className="font-semibold">{t('programs.editor.recoverTitle')}</p>
      <p className="text-sm">{t('programs.editor.recoverDescription')}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRecover}>{t('programs.editor.recover')}</Button>
        <Button variant="ghost" onClick={onDiscard}>
          {t('programs.editor.discard')}
        </Button>
      </div>
    </div>
  );
}
