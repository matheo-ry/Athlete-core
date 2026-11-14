import { useTranslation } from 'react-i18next';

import { DEFAULT_BRAND } from '@/core/branding';
import { cn } from '@/core/lib';
import type { Membership } from '@/core/tenancy';

import { BrandBadge } from './BrandBadge';

interface SpaceListProps {
  spaces: readonly Membership[];
  /** El espacio en el que está ahora: se marca y no es un botón. */
  currentTenantId?: string | null;
  onChoose: (space: Membership) => void;
}

const ROW = 'border-border flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left';

/**
 * La lista de espacios (D-056): cada uno con su distintivo, su nombre y si se
 * entra como coach o como cliente. La usan el selector y "Mis espacios".
 */
export function SpaceList({ spaces, currentTenantId = null, onChoose }: SpaceListProps) {
  const { t } = useTranslation();

  return (
    <ul aria-label={t('app.spaces.listLabel')} className="flex flex-col gap-2">
      {spaces.map((space) => {
        const content = (
          <>
            <BrandBadge brand={space.tenant?.branding ?? DEFAULT_BRAND} />
            <span className="flex flex-1 flex-col">
              <span className="font-medium">{space.tenantName}</span>
              <span className="text-muted text-sm">
                {t(space.role === 'client' ? 'app.spaces.roleClient' : 'app.spaces.roleCoach')}
              </span>
            </span>
          </>
        );
        return (
          <li key={space.tenantId}>
            {space.tenantId === currentTenantId ? (
              <div aria-current="true" className={cn(ROW, 'bg-surface')}>
                {content}
                <span className="text-sm font-medium">{t('app.spaces.current')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onChoose(space)}
                className={cn(
                  ROW,
                  'hover:bg-surface focus-visible:outline-primary-readable focus-visible:outline-2',
                )}
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
