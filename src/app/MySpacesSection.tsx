import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { sortedSpaces, useTenancyContext } from '@/core/tenancy';
import { Card, buttonClassName } from '@/core/ui';

import { SpaceList } from './SpaceList';
import { useChooseSpace } from './useChooseSpace';

/**
 * "Mis espacios" (D-056), en el perfil del cliente y en los ajustes del coach:
 * los espacios para cambiar de uno a otro, "Añadir un coach con código" y, si
 * todavía no tiene negocio, "Crear mi negocio".
 */
export function MySpacesSection() {
  const { t } = useTranslation();
  const { memberships, tenancy } = useTenancyContext();
  const choose = useChooseSpace();
  const isOwner = memberships.some((membership) => membership.role === 'owner');

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('app.spaces.title')}</h2>
        <SpaceList
          spaces={sortedSpaces(memberships)}
          currentTenantId={tenancy.tenant?.id ?? null}
          onChoose={choose}
        />
        <div className="flex flex-col gap-2">
          <Link to="/join" className={buttonClassName('secondary')}>
            {t('app.spaces.addCoach')}
          </Link>
          {isOwner ? null : (
            <Link to="/create-business" className={buttonClassName('secondary')}>
              {t('app.spaces.createBusiness')}
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
