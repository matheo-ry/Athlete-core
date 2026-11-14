import { useState } from 'react';
import type { FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import { TERMS_VERSION } from '@/core/auth';
import { clearCoachIntent, useCreateBusiness, useTenancyContext } from '@/core/tenancy';
import type { CreateBusinessResult } from '@/core/tenancy';
import { Button, Checkbox, Input } from '@/core/ui';

const NAME_MIN = 2;
const NAME_MAX = 40; // D-049: el mismo límite que el nombre de la marca (D-057)

const FAILURE_KEYS: Partial<Record<CreateBusinessResult['status'], string>> = {
  invalid_name: 'app.createBusiness.nameTooShort',
  terms_required: 'app.createBusiness.termsRequired',
  offline: 'core.errors.offline',
};

/**
 * Crear el negocio del coach (D-049 y D-060): solo el nombre y aceptar las
 * condiciones para coaches. Nace con el plan free y la marca de ATHLETE CORE
 * con su nombre. Quien ya es dueño de uno va a su zona (un negocio por dueño).
 */
export function CreateBusinessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { memberships } = useTenancyContext();
  const createBusiness = useCreateBusiness();
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [termsError, setTermsError] = useState<string | undefined>();
  const [failure, setFailure] = useState<string | null>(null);

  if (memberships.some((membership) => membership.role === 'owner')) {
    clearCoachIntent();
    return <Navigate to="/coach" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    const length = name.trim().length;
    const nextNameError =
      length < NAME_MIN
        ? t('app.createBusiness.nameTooShort')
        : length > NAME_MAX
          ? t('app.createBusiness.nameTooLong')
          : undefined;
    const nextTermsError = accepted ? undefined : t('app.createBusiness.termsRequired');
    setNameError(nextNameError);
    setTermsError(nextTermsError);
    if (nextNameError !== undefined || nextTermsError !== undefined) {
      return;
    }
    void createBusiness
      .mutateAsync({ name: name.trim(), coachTermsVersion: TERMS_VERSION })
      .then((result) => {
        if (result.status === 'created' || result.status === 'already_owner') {
          clearCoachIntent();
          void navigate('/coach', { replace: true });
        } else {
          setFailure(t(FAILURE_KEYS[result.status] ?? 'core.errors.unexpected'));
        }
      });
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.createBusiness.title')}</h1>
        <p className="text-muted">{t('app.createBusiness.description')}</p>
      </header>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('app.createBusiness.nameLabel')}
          hint={t('app.createBusiness.nameHint')}
          name="business-name"
          autoComplete="organization"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />
        <Checkbox
          name="coach-terms"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          error={termsError}
          label={
            <Trans
              i18nKey="app.createBusiness.terms"
              components={{
                // Se abre aparte para no perder lo escrito.
                terms: (
                  <a
                    href="/legal/coach-terms"
                    target="_blank"
                    rel="noopener"
                    className="text-primary-readable font-medium underline"
                  />
                ),
              }}
            />
          }
        />
        {failure !== null ? (
          <p role="alert" className="text-danger text-sm font-medium">
            {failure}
          </p>
        ) : null}
        <Button type="submit" disabled={createBusiness.isPending}>
          {createBusiness.isPending
            ? t('app.createBusiness.submitting')
            : t('app.createBusiness.submit')}
        </Button>
      </form>
    </>
  );
}
