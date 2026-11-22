import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useAuth } from '@/core/auth';
import { parseInviteCodeParam } from '@/core/tenancy';

import { InviteCodeForm } from './InviteCodeForm';
import { JoinCodeView } from './JoinCodeView';

/**
 * Unirse a un coach: `/join?code=XXXX` (D-051). El código es un dato de fuera y
 * se valida antes de usarlo. Sin código, se pide. Con sesión (por ejemplo,
 * desde "Añadir un coach con código", D-056), se puede volver atrás.
 */
export function JoinPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = parseInviteCodeParam(searchParams.get('code'));

  const changeCode = (next: string | null) => {
    setSearchParams(next === null ? {} : { code: next });
  };

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">{t('app.join.title')}</h1>
      </header>
      {code === '' ? (
        <InviteCodeForm onSubmit={changeCode} />
      ) : (
        // `key`: cada código empieza de cero (su vista previa y su alta).
        <JoinCodeView key={code} code={code} onOtherCode={changeCode} />
      )}
      {status === 'signed-in' ? (
        <Link to="/" className="text-primary-readable text-center text-sm underline">
          {t('app.join.back')}
        </Link>
      ) : null}
    </>
  );
}
