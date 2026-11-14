import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { useBrandPreview } from '@/core/branding';
import { usePendingInvite } from '@/core/tenancy';

import { BrandBadge } from '../BrandBadge';

/**
 * Mientras hay un código recordado, las pantallas de cuenta (entrar, crear la
 * cuenta, confirmar el email…) se ven con la marca de ese coach (D-037 y D-057),
 * con un recordatorio de a quién se está uniendo.
 */
export function PendingInviteBrand() {
  const { t } = useTranslation();
  const pending = usePendingInvite();
  useBrandPreview(pending?.branding ?? null);

  return (
    <>
      {pending !== null ? (
        <div className="bg-surface border-border flex items-center gap-3 rounded-lg border p-3">
          <BrandBadge brand={pending.branding} />
          <p className="text-sm">{t('app.pendingInvite.joining', { name: pending.name })}</p>
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
