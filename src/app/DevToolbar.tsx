import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { cn } from '@/core/lib';
import { useSampleTenancyControls, useTenancy } from '@/core/tenancy';
import type { Profile } from '@/core/tenancy';

const PROFILES: readonly Profile[] = ['coach', 'client'];

function toggleClassName(isActive: boolean): string {
  return cn(
    'min-h-11 rounded-lg px-3 font-medium transition-colors',
    'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:outline-offset-2',
    isActive ? 'bg-primary text-on-primary' : 'text-muted hover:text-foreground',
  );
}

/**
 * Selector SOLO de desarrollo: ver la app como coach, como cliente o como alguien
 * que todavía no tiene coach, y probar dos marcas de ejemplo. `RootLayout` solo
 * lo carga con `import.meta.env.DEV`, así que no existe en la compilación de
 * producción.
 */
export function DevToolbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenant, profile } = useTenancy();
  const { tenants, selectTenant, selectRole } = useSampleTenancyControls();

  const viewAs = (nextProfile: Profile) => {
    selectRole(nextProfile === 'coach' ? 'owner' : 'client');
    void navigate(`/${nextProfile}`);
  };

  // Sin tenant, "/" lleva a la bienvenida, como le pasará a un usuario nuevo.
  const viewWithoutTenant = () => {
    selectTenant(null);
    void navigate('/');
  };

  return (
    <aside
      aria-label={t('app.dev.label')}
      data-testid="dev-toolbar"
      className="border-border bg-surface text-foreground flex flex-wrap items-center gap-x-6 gap-y-1 border-b px-3 py-1 text-xs"
    >
      <div role="group" aria-label={t('app.dev.profile')} className="flex items-center gap-1">
        <span className="text-muted">{t('app.dev.profile')}</span>
        {PROFILES.map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`dev-profile-${option}`}
            aria-pressed={profile === option}
            onClick={() => viewAs(option)}
            className={toggleClassName(profile === option)}
          >
            {t(`app.dev.${option}`)}
          </button>
        ))}
      </div>
      <div role="group" aria-label={t('app.dev.brand')} className="flex items-center gap-1">
        <span className="text-muted">{t('app.dev.brand')}</span>
        {tenants.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={tenant?.id === option.id}
            onClick={() => selectTenant(option.id)}
            className={toggleClassName(tenant?.id === option.id)}
          >
            {option.branding.appName}
          </button>
        ))}
        <button
          type="button"
          data-testid="dev-no-tenant"
          aria-pressed={tenant === null}
          onClick={viewWithoutTenant}
          className={toggleClassName(tenant === null)}
        >
          {t('app.dev.noTenant')}
        </button>
      </div>
    </aside>
  );
}
