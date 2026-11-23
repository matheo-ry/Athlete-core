import { useTranslation } from 'react-i18next';

import { useAuth } from '@/core/auth';
import { canLogWorkouts, getUploadQueue, useUploadQueue } from '@/core/native';
import { cn } from '@/core/lib';
import { Button, useOnlineStatus } from '@/core/ui';

import { LiveWorkoutPill } from './LiveWorkoutPill';
import { RestTimerBar } from './RestTimerBar';
import { useOfflineSnapshotRefresh, useUploadPending } from '../api/useWorkoutSync';
import { TimedOutNotice } from './TimedOutNotice';
import { useResumeOnOpen } from './useResumeOnOpen';
import { useWorkoutLifecycle } from './useWorkoutLifecycle';

/**
 * Lo que `workouts` hace sin pantalla mientras hay sesión (D-143): guardar en
 * el móvil lo necesario para entrenar sin cobertura y subir lo pendiente. Si la
 * base de datos rechaza algo, lo avisa (D-118). Solo donde se puede entrenar
 * (`canLogWorkouts`, D-116): en la web publicada no hay nada que guardar ni subir.
 */
export function WorkoutsService() {
  const { user } = useAuth();
  return user === null || !canLogWorkouts() ? null : <SyncForUser userId={user.id} />;
}

function SyncForUser({ userId }: { userId: string }) {
  const refreshSnapshot = useOfflineSnapshotRefresh(userId);
  useUploadPending(userId, refreshSnapshot);
  useResumeOnOpen();
  useWorkoutLifecycle(userId);
  return (
    <>
      <TimedOutNotice />
      <RestTimerBar />
      <LiveWorkoutPill />
      <PendingUploadsBadge userId={userId} />
      <RejectedUploadsNotice userId={userId} />
    </>
  );
}

/**
 * "Pendiente de subir" (D-118) mientras haya algo en la cola que no se ha
 * podido subir: sin conexión o tras fallar un intento. Con conexión, lo
 * recién encolado sube en un momento y no se enseña, para que no parpadee en
 * cada serie (D-149).
 */
function PendingUploadsBadge({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const pending = useUploadQueue(userId).filter((item) => item.status === 'pending');
  if (pending.length === 0 || (isOnline && pending.every((item) => item.attempts === 0))) {
    return null;
  }
  return (
    <p
      role="status"
      className={cn(
        'glass-float text-foreground fixed right-4 z-50 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold',
        // Debajo de la franja "Sin conexión" (D-061), que va arriba del todo.
        isOnline ? 'top-[calc(0.5rem+var(--safe-top))]' : 'top-[calc(3rem+var(--safe-top))]',
      )}
    >
      <span aria-hidden="true" className="bg-accent size-1.5 animate-pulse rounded-full" />
      {t('workouts.sync.pending')}
    </p>
  );
}

/** "No se pudo guardar: ya no tienes acceso a …" (D-118), hasta que el cliente lo lee. */
function RejectedUploadsNotice({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const rejected = useUploadQueue(userId).filter((item) => item.status === 'rejected');
  if (rejected.length === 0) {
    return null;
  }
  const noAccess = [
    ...new Set(
      rejected.filter((item) => item.rejection === 'no_access').map((item) => item.tenantName),
    ),
  ];
  const invalid = rejected.filter((item) => item.rejection === 'invalid').length;

  return (
    <div
      role="alert"
      className="glass-float fixed inset-x-4 bottom-[calc(6.25rem+var(--safe-bottom))] z-50 mx-auto flex max-w-lg flex-col gap-3 rounded-[1.6rem] p-5 lg:bottom-8"
    >
      {noAccess.map((name) => (
        <p key={name} className="text-sm font-semibold">
          {t('workouts.sync.noAccess', { name })}
        </p>
      ))}
      {invalid > 0 ? (
        <p className="text-sm font-semibold">{t('workouts.sync.invalid', { count: invalid })}</p>
      ) : null}
      <div>
        <Button onClick={() => void getUploadQueue().dismissRejected(userId)}>
          {t('workouts.sync.dismiss')}
        </Button>
      </div>
    </div>
  );
}
