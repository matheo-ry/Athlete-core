import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { env } from '@/core/config';
import { copyText, shareOrCopyLink } from '@/core/native';
import {
  formatInviteCode,
  useInviteCode,
  useRegenerateInviteCode,
  useTenancy,
} from '@/core/tenancy';
import { Button, Card, Spinner } from '@/core/ui';

type Notice = 'copied' | 'linkCopied' | 'copyFailed' | 'regenerated' | null;

/** El enlace para unirse: la web pública si está configurada; si no, esta misma dirección. */
function inviteLink(code: string): string {
  const base = env.publicAppUrl ?? window.location.origin;
  return `${base}/join?code=${code}`;
}

/**
 * El código de invitación del negocio (D-050 y D-051): verlo en dos grupos de
 * cuatro, copiarlo, compartir el enlace y, solo el dueño, regenerarlo.
 */
export function InviteCodeCard() {
  const { t } = useTranslation();
  const { tenant, role } = useTenancy();
  const { data: code, isPending, isError, refetch } = useInviteCode();
  const regenerate = useRegenerateInviteCode();
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  if (isPending) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }
  if (isError || code === null || code === undefined) {
    return (
      <Card>
        <Button variant="secondary" onClick={() => void refetch()}>
          {t('core.ui.retry')}
        </Button>
      </Card>
    );
  }

  const handleCopy = () => {
    void copyText(code).then((ok) => setNotice(ok ? 'copied' : 'copyFailed'));
  };
  const handleShare = () => {
    const title = t('clients.code.shareTitle', { name: tenant?.name ?? '' });
    void shareOrCopyLink(inviteLink(code), title).then((outcome) => {
      if (outcome === 'copied') {
        setNotice('linkCopied');
      } else if (outcome === 'failed') {
        setNotice('copyFailed');
      }
    });
  };
  const handleRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => {
        setIsConfirming(false);
        setNotice('regenerated');
      },
    });
  };

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">{t('clients.code.title')}</h2>
          <p className="text-muted text-sm">{t('clients.code.description')}</p>
        </div>
        <p
          data-testid="invite-code"
          className="font-mono text-3xl font-bold tracking-widest select-all"
        >
          {formatInviteCode(code)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleCopy}>
            {t('clients.code.copy')}
          </Button>
          <Button onClick={handleShare}>{t('clients.code.share')}</Button>
        </div>
        {notice !== null ? (
          <p role="status" className="text-muted text-sm">
            {t(`clients.code.${notice}`)}
          </p>
        ) : null}
        {regenerate.isError ? (
          <p role="alert" className="text-danger text-sm">
            {t('core.errors.unexpected')}
          </p>
        ) : null}

        {role === 'owner' && !isConfirming ? (
          <Button variant="ghost" onClick={() => setIsConfirming(true)}>
            {t('clients.code.regenerate')}
          </Button>
        ) : null}
        {role === 'owner' && isConfirming ? (
          <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-sm">{t('clients.code.regenerateConfirm')}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRegenerate} disabled={regenerate.isPending}>
                {regenerate.isPending
                  ? t('clients.code.regenerating')
                  : t('clients.code.regenerateYes')}
              </Button>
              <Button variant="ghost" onClick={() => setIsConfirming(false)}>
                {t('clients.code.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
