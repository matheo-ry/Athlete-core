import { LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/core/auth';
import { cn } from '@/core/lib';
import { getDeviceStore, getUploadQueue, useUploadQueue } from '@/core/native';
import { Button } from '@/core/ui';

interface SignOutButtonProps {
  className?: string;
}

/**
 * Cerrar sesión en este dispositivo. Al cerrar, `RequireAuth` lleva a /login.
 * Con entrenos sin subir, pregunta antes: al cerrar sesión se pierden (D-118).
 */
export function SignOutButton({ className }: SignOutButtonProps) {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const userId = user?.id ?? null;
  const pending = useUploadQueue(userId).filter((item) => item.status === 'pending').length;
  const [isAsking, setIsAsking] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const close = () => {
    setIsPending(true);
    setHasFailed(false);
    signOut()
      // Lo que quedaba en la cola ya no se subirá, y nada suyo se queda en el
      // teléfono: en un móvil compartido, otra persona no debe heredarlo.
      .then(async () => {
        if (userId !== null) {
          await getUploadQueue().clear(userId);
          await getDeviceStore().removeUser(userId);
        }
      })
      .catch(() => setHasFailed(true))
      .finally(() => {
        setIsPending(false);
        setIsAsking(false);
      });
  };

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <button
        type="button"
        onClick={() => (pending > 0 ? setIsAsking(true) : close())}
        disabled={isPending || isAsking}
        className="text-muted hover:text-foreground focus-visible:outline-primary-readable inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium focus-visible:outline-2 disabled:opacity-50"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {t('app.shell.signOut')}
      </button>
      {isAsking ? (
        <PendingUploadsWarning
          isPending={isPending}
          onCancel={() => setIsAsking(false)}
          onConfirm={close}
        />
      ) : null}
      {hasFailed ? (
        <p role="alert" className="text-danger text-xs">
          {t('core.errors.unexpected')}
        </p>
      ) : null}
    </div>
  );
}

interface PendingUploadsWarningProps {
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Tienes entrenos sin subir. Si cierras sesión, se perderán" (D-118). */
function PendingUploadsWarning({ isPending, onCancel, onConfirm }: PendingUploadsWarningProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  // El foco va a "Cancelar", el primer botón: es lo que no pierde nada.
  useEffect(() => {
    dialog.current?.querySelector('button')?.focus();
  }, []);

  return (
    <div
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      className="border-border flex flex-col gap-2 rounded-lg border p-3"
    >
      <p id={titleId} className="text-sm font-semibold">
        {t('app.shell.pendingUploads')}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onCancel}>{t('app.shell.keepSession')}</Button>
        <Button variant="ghost" onClick={onConfirm} disabled={isPending}>
          {t('app.shell.signOutAnyway')}
        </Button>
      </div>
    </div>
  );
}
