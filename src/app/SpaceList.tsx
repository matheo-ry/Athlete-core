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

const ROW =
  'flex min-h-16 w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-200';

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
            <BrandBadge brand={space.tenant?.branding ?? DEFAULT_BRAND} round />
            <span className="flex flex-1 flex-col">
              <span className="font-semibold">{space.tenantName}</span>
              <span className="text-muted text-sm">
                {t(space.role === 'client' ? 'app.spaces.roleClient' : 'app.spaces.roleCoach')}
              </span>
            </span>
          </>
        );
        return (
          <li key={space.tenantId}>
            {space.tenantId === currentTenantId ? (
              <div
                aria-current="true"
                className={cn(
                  ROW,
                  'bg-primary-soft shadow-[inset_0_0_0_1px_var(--color-hairline)]',
                )}
              >
                {content}
                <span className="eyebrow text-primary-readable">{t('app.spaces.current')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onChoose(space)}
                className={cn(ROW, 'glass focus-ring hover:bg-glass-hover active:scale-[0.99]')}
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
