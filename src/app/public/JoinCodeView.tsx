import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useAuth } from '@/core/auth';
import { useBrandPreview } from '@/core/branding';
import { useInvitePreview, useJoinWithCode } from '@/core/tenancy';
import { Button, Card, Spinner, buttonClassName } from '@/core/ui';

import { BrandBadge } from '../BrandBadge';
import { InviteCodeForm } from './InviteCodeForm';
import { joinMessageKey } from './join-messages';
import type { JoinFailure } from './join-messages';

interface JoinCodeViewProps {
  code: string;
  onOtherCode: (code: string | null) => void;
}

/**
 * La vista previa del coach de un código y el alta (D-051 y D-054). Se ve con
 * la marca del coach. Sin sesión: "Crear cuenta" o "Ya tengo cuenta", y al
 * terminar se vuelve aquí. Con sesión: "Unirme".
 */
export function JoinCodeView({ code, onOtherCode }: JoinCodeViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const { mutate: requestPreview, data: preview } = useInvitePreview();
  const join = useJoinWithCode();
  const [joinFailure, setJoinFailure] = useState<JoinFailure | null>(null);
  const [ownTenant, setOwnTenant] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  // Una sola vez por código, aunque React repita el efecto en desarrollo: un
  // código equivocado pedido dos veces contaría dos intentos (D-052).
  useEffect(() => {
    if (requested.current === code) {
      return;
    }
    requested.current = code;
    requestPreview(code);
  }, [code, requestPreview]);

  useBrandPreview(preview?.status === 'ok' ? preview.branding : null);

  const handleJoin = () => {
    setJoinFailure(null);
    void join.mutateAsync(code).then((result) => {
      if (result.status === 'joined' || result.status === 'already_member') {
        void navigate('/client', { replace: true });
      } else {
        setJoinFailure(result.status);
        setOwnTenant(result.status === 'own_business' ? result.tenantId : null);
      }
    });
  };

  if (preview === undefined) {
    return <Spinner label={t('app.join.checking')} />;
  }

  if (preview.status !== 'ok') {
    return (
      <>
        <p role="alert" className="text-danger font-medium">
          {t(joinMessageKey(preview.status))}
        </p>
        <InviteCodeForm onSubmit={onOtherCode} />
      </>
    );
  }

  const next = new URLSearchParams({ next: `/join?code=${code}` }).toString();

  return (
    <>
      <Card>
        <div className="flex items-center gap-4">
          <BrandBadge brand={preview.branding} size="lg" />
          <p className="text-lg font-semibold">{t('app.join.trainWith', { name: preview.name })}</p>
        </div>
      </Card>

      {joinFailure !== null ? (
        <p role="alert" className="text-danger font-medium">
          {t(joinMessageKey(joinFailure))}
        </p>
      ) : null}

      {authStatus === 'signed-in' ? (
        <div className="flex flex-col gap-2">
          {ownTenant !== null ? (
            <Button onClick={() => void navigate('/coach', { replace: true })}>
              {t('app.join.goToBusiness')}
            </Button>
          ) : (
            <Button onClick={handleJoin} disabled={join.isPending}>
              {join.isPending ? t('app.join.joining') : t('app.join.submit')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Link to={`/signup?${next}`} className={buttonClassName('primary')}>
            {t('app.join.createAccount')}
          </Link>
          <Link to={`/login?${next}`} className={buttonClassName('secondary')}>
            {t('app.join.haveAccount')}
          </Link>
        </div>
      )}

      <Button variant="ghost" onClick={() => onOtherCode(null)}>
        {t('app.join.otherCode')}
      </Button>
    </>
  );
}
