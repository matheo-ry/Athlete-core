import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { Button, Input, buttonClassName } from '@/core/ui';

import { parseJoinCode } from './join-code';

/**
 * Unirse a un coach con su código. En la Fase 0 es solo la pantalla: la llamada
 * a `join_tenant_with_code` y la vista previa del coach llegan en la Fase 1.
 */
export function JoinPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => parseJoinCode(searchParams.get('code')));
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(true);
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.join.title')}</h1>
        <p className="text-muted">{t('app.join.description')}</p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('app.join.codeLabel')}
          hint={t('app.join.codeHint')}
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <Button type="submit">{t('app.join.submit')}</Button>
        {wasSubmitted ? (
          <p role="status" className="text-muted text-sm">
            {t('app.join.notAvailable')}
          </p>
        ) : null}
      </form>
      <Link to="/welcome" className={buttonClassName('ghost')}>
        {t('app.join.back')}
      </Link>
    </>
  );
}
