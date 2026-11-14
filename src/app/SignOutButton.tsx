import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/core/auth';
import { cn } from '@/core/lib';

interface SignOutButtonProps {
  className?: string;
}

/**
 * Cerrar sesión en este dispositivo. Provisional en la cabecera de las dos zonas:
 * pasa al perfil en el PR 1.13. Al cerrar, `RequireAuth` lleva a /login.
 */
export function SignOutButton({ className }: SignOutButtonProps) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const handleClick = () => {
    setIsPending(true);
    setHasFailed(false);
    signOut()
      .catch(() => setHasFailed(true))
      .finally(() => setIsPending(false));
  };

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-muted hover:text-foreground focus-visible:outline-primary-readable inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium focus-visible:outline-2 disabled:opacity-50"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {t('app.shell.signOut')}
      </button>
      {hasFailed ? (
        <p role="alert" className="text-danger text-xs">
          {t('core.errors.unexpected')}
        </p>
      ) : null}
    </div>
  );
}
