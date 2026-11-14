import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/core/ui';

interface LegalPageProps {
  document: 'terms' | 'privacy' | 'coachTerms';
}

const PARAGRAPHS = ['p1', 'p2', 'p3', 'p4'] as const;

/**
 * Términos, política de privacidad y condiciones para coaches (D-060). Hoy son BORRADORES: ningún usuario
 * real puede registrarse hasta tener los textos definitivos (Fase 4).
 */
export function LegalPage({ document }: LegalPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <span className="border-border text-muted w-fit rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          {t('app.legal.draft')}
        </span>
        <h1 className="text-2xl font-bold">{t(`app.legal.${document}.title`)}</h1>
        <p className="text-muted text-sm">{t('app.legal.draftNotice')}</p>
      </header>
      {PARAGRAPHS.map((paragraph) => (
        <p key={paragraph}>{t(`app.legal.${document}.${paragraph}`)}</p>
      ))}
      <Button variant="ghost" onClick={() => void navigate(-1)}>
        {t('app.legal.back')}
      </Button>
    </article>
  );
}
