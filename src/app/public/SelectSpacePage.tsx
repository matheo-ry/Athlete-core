import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { sortedSpaces, useTenancyContext } from '@/core/tenancy';

import { SignOutButton } from '../SignOutButton';
import { SpaceList } from '../SpaceList';
import { useChooseSpace } from '../useChooseSpace';

/**
 * El selector (`/select`, D-056): para quien tiene varios espacios y todavía
 * no ha elegido en este dispositivo. Con uno o ninguno, no se ve nunca.
 */
export function SelectSpacePage() {
  const { t } = useTranslation();
  const { memberships, homePath } = useTenancyContext();
  const choose = useChooseSpace({ replace: true });
  const spaces = sortedSpaces(memberships);

  if (spaces.length < 2) {
    return <Navigate to={homePath} replace />;
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
          {t('app.spaces.selectTitle')}
        </h1>
        <p className="text-muted">{t('app.spaces.selectDescription')}</p>
      </header>
      <SpaceList spaces={spaces} onChoose={choose} />
      <div className="border-border border-t pt-4">
        <SignOutButton />
      </div>
    </>
  );
}
