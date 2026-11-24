import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useClientStatusChange } from '@/core/tenancy';
import type { MemberActionResult, TenantMember } from '@/core/tenancy';
import { Button } from '@/core/ui';

interface ClientStatusActionsProps {
  client: TenantMember;
}

const FAILURE_KEYS: Partial<Record<MemberActionResult, string>> = {
  plan_full: 'clients.detail.planFull',
  offline: 'core.errors.offline',
};

/**
 * "Dar de baja" (con confirmación que explica qué pasa) o "Reactivar" (D-055).
 * Solo lo ve el dueño del negocio.
 */
export function ClientStatusActions({ client }: ClientStatusActionsProps) {
  const { t } = useTranslation();
  const archive = useClientStatusChange('archive');
  const reactivate = useClientStatusChange('reactivate');
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const show = (result: MemberActionResult, successKey: string) => {
    if (result === 'ok') {
      setMessage({ text: t(successKey, { name: client.displayName }), isError: false });
    } else {
      setMessage({ text: t(FAILURE_KEYS[result] ?? 'core.errors.unexpected'), isError: true });
    }
  };

  const handleArchive = () => {
    void archive.mutateAsync(client.userId).then((result) => {
      setIsConfirming(false);
      show(result, 'clients.detail.archived');
    });
  };
  const handleReactivate = () => {
    void reactivate.mutateAsync(client.userId).then((result) => {
      show(result, 'clients.detail.reactivated');
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {message !== null ? (
        <p
          role={message.isError ? 'alert' : 'status'}
          className={message.isError ? 'text-danger text-sm font-medium' : 'text-sm'}
        >
          {message.text}
        </p>
      ) : null}

      {client.status === 'archived' ? (
        <Button onClick={handleReactivate} disabled={reactivate.isPending}>
          {reactivate.isPending ? t('clients.detail.reactivating') : t('clients.detail.reactivate')}
        </Button>
      ) : null}

      {client.status === 'active' && !isConfirming ? (
        // Dar de baja no es lo principal de la ficha: discreto, y rojo al pasar por encima.
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="focus-ring text-muted hover:text-danger min-h-11 self-start rounded-full px-1 text-sm font-semibold transition-colors"
        >
          {t('clients.detail.archive')}
        </button>
      ) : null}

      {client.status === 'active' && isConfirming ? (
        <div className="border-danger/40 bg-danger-soft flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm">{t('clients.detail.archiveConfirm')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={handleArchive} disabled={archive.isPending}>
              {archive.isPending ? t('clients.detail.archiving') : t('clients.detail.archiveYes')}
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirming(false)}>
              {t('clients.detail.cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
