import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { parseInviteCodeParam } from '@/core/tenancy';

import { InviteCodeForm } from './InviteCodeForm';
import { JoinCodeView } from './JoinCodeView';

/**
 * Unirse a un coach: `/join?code=XXXX` (D-051). El código es un dato de fuera y
 * se valida antes de usarlo. Sin código, se pide.
 */
export function JoinPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = parseInviteCodeParam(searchParams.get('code'));

  const changeCode = (next: string | null) => {
    setSearchParams(next === null ? {} : { code: next });
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.join.title')}</h1>
      </header>
      {code === '' ? (
        <InviteCodeForm onSubmit={changeCode} />
      ) : (
        // `key`: cada código empieza de cero (su vista previa y su alta).
        <JoinCodeView key={code} code={code} onOtherCode={changeCode} />
      )}
    </>
  );
}
