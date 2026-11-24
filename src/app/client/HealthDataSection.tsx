import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/core/lib';
import { useHealthConsent, useHealthConsentPrompt, useTenancy } from '@/core/tenancy';
import type { HealthConsentChange, HealthConsentState } from '@/core/tenancy';
import { Button, Card, ErrorState, Spinner } from '@/core/ui';

/**
 * Perfil → "Datos de salud" (D-126): si el permiso está dado, darlo y retirarlo.
 * Retirarlo borra el peso, las medidas y las notas de ese espacio, así que pide
 * confirmación. Es del espacio activo: con otro coach, otro permiso.
 */
export function HealthDataSection() {
  const { t } = useTranslation();
  const coach = useTenancy().tenant?.name ?? '';
  const consent = useHealthConsent();

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('app.healthData.title')}</h2>
        <p className="text-muted text-sm">{t('app.healthData.description', { coach })}</p>
        {consent.isPending ? <Spinner /> : null}
        {consent.isError ? <ErrorState onRetry={() => void consent.refetch()} /> : null}
        {consent.state === undefined ? null : (
          <ConsentControls state={consent.state} coach={coach} withdraw={consent.withdraw} />
        )}
      </div>
    </Card>
  );
}

interface ConsentControlsProps {
  state: HealthConsentState;
  coach: string;
  withdraw: () => Promise<HealthConsentChange>;
}

function ConsentControls({ state, coach, withdraw }: ConsentControlsProps) {
  const { t, i18n } = useTranslation();
  const { ensure } = useHealthConsentPrompt();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [failure, setFailure] = useState<'offline' | 'error' | null>(null);

  const confirmWithdraw = () => {
    setIsPending(true);
    setFailure(null);
    void withdraw()
      .then((result) => {
        if (result === 'ok') {
          setIsConfirming(false);
        } else {
          setFailure(result);
        }
      })
      .catch(() => {
        setFailure('error');
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <>
      <p className="text-sm font-medium" data-testid="health-consent-status">
        {state.status === 'granted'
          ? t('app.healthData.statusGranted', {
              date: formatDate(state.grantedAt, i18n.language),
            })
          : state.status === 'withdrawn'
            ? t('app.healthData.statusWithdrawn', {
                date: formatDate(state.withdrawnAt, i18n.language),
                coach,
              })
            : t('app.healthData.statusNone')}
      </p>
      {state.status === 'granted' ? (
        isConfirming ? (
          <WithdrawConfirmation
            coach={coach}
            isPending={isPending}
            onCancel={() => {
              setIsConfirming(false);
              setFailure(null);
            }}
            onConfirm={confirmWithdraw}
          />
        ) : (
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setIsConfirming(true);
              }}
            >
              {t('app.healthData.withdraw')}
            </Button>
          </div>
        )
      ) : (
        <div>
          {/* La misma ventana que al entrar: así el texto es siempre el mismo. */}
          <Button onClick={() => void ensure()}>{t('app.healthData.give')}</Button>
        </div>
      )}
      {failure === null ? null : (
        <p role="alert" className="text-danger text-sm font-medium">
          {t(failure === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected')}
        </p>
      )}
    </>
  );
}

interface WithdrawConfirmationProps {
  coach: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Se borrarán tu peso, tus medidas y tus notas": no se puede deshacer. */
function WithdrawConfirmation({
  coach,
  isPending,
  onCancel,
  onConfirm,
}: WithdrawConfirmationProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);

  // El foco va a "Cancelar", el primer botón: es lo que no borra nada.
  useEffect(() => {
    box.current?.querySelector('button')?.focus();
  }, []);

  return (
    <div
      ref={box}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="border-danger/40 flex flex-col gap-3 rounded-2xl border p-4"
    >
      <p id={titleId} className="text-sm font-semibold">
        {t('app.healthData.confirmTitle')}
      </p>
      <p id={bodyId} className="text-muted text-sm">
        {t('app.healthData.confirmBody', { coach })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          {t('app.healthData.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {t('app.healthData.confirmWithdraw')}
        </Button>
      </div>
    </div>
  );
}
