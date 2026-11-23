import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useAuth } from '@/core/auth';
import { useBrandPreview } from '@/core/branding';
import {
  clearPendingInvite,
  rememberPendingInvite,
  useInvitePreview,
  useJoinWithCode,
  usePendingInvite,
  useTenancyContext,
} from '@/core/tenancy';
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
 * La vista previa del coach de un código y el alta (D-037, D-051 y D-054). Se ve
 * con la marca del coach. Sin sesión: "Crear cuenta" o "Ya tengo cuenta"; el
 * código se recuerda y, al volver aquí con la cuenta lista, el alta se hace sola.
 * Con sesión: "Unirme".
 */
export function JoinCodeView({ code, onOtherCode }: JoinCodeViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const pending = usePendingInvite();
  const { selectTenant } = useTenancyContext();
  const { mutate: requestPreview, data: preview } = useInvitePreview();
  const { mutateAsync: joinWithCode, isPending: isJoining } = useJoinWithCode();
  const [joinFailure, setJoinFailure] = useState<JoinFailure | null>(null);
  const [ownTenant, setOwnTenant] = useState<string | null>(null);
  const requested = useRef<string | null>(null);
  const autoJoined = useRef(false);

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

  const handleJoin = useCallback(() => {
    setJoinFailure(null);
    void joinWithCode(code).then((result) => {
      // Pase lo que pase, el código ya no queda pendiente: o ha entrado, o el
      // mensaje dice qué hacer.
      clearPendingInvite();
      if (result.status === 'joined' || result.status === 'already_member') {
        void navigate('/client', { replace: true });
      } else {
        setJoinFailure(result.status);
        setOwnTenant(result.status === 'own_business' ? result.tenantId : null);
      }
    });
  }, [code, joinWithCode, navigate]);

  // D-037: quien vuelve aquí tras crear la cuenta o entrar, con este código
  // recordado, se une solo, sin volver a pulsar nada.
  const shouldAutoJoin =
    authStatus === 'signed-in' && pending?.code === code && preview?.status === 'ok';
  useEffect(() => {
    if (shouldAutoJoin && !autoJoined.current) {
      autoJoined.current = true;
      handleJoin();
    }
  }, [shouldAutoJoin, handleJoin]);

  if (preview === undefined || (shouldAutoJoin && isJoining)) {
    return <Spinner label={t(isJoining ? 'app.join.joining' : 'app.join.checking')} />;
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
  // Al ir a crear la cuenta o a entrar, el código se recuerda (D-037): esas
  // pantallas se ven con la marca del coach y, al terminar, el alta se hace sola.
  const { name, branding } = preview;
  const rememberCode = () => rememberPendingInvite({ code, name, branding });

  return (
    <>
      <Card tone="accent" className="p-5">
        <div className="flex items-center gap-4">
          <BrandBadge brand={preview.branding} size="lg" />
          <p className="text-2xl leading-tight font-semibold tracking-tight">
            {t('app.join.trainWith', { name: preview.name })}
          </p>
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
            <Button
              onClick={() => {
                // Con varios espacios, hay que entrar en el propio (D-056).
                selectTenant(ownTenant);
                void navigate('/coach', { replace: true });
              }}
            >
              {t('app.join.goToBusiness')}
            </Button>
          ) : (
            <Button size="lg" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? t('app.join.joining') : t('app.join.submit')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Link
            to={`/signup?${next}`}
            onClick={rememberCode}
            className={buttonClassName('primary', undefined, 'lg')}
          >
            {t('app.join.createAccount')}
          </Link>
          <Link
            to={`/login?${next}`}
            onClick={rememberCode}
            className={buttonClassName('secondary')}
          >
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
