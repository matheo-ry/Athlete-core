import { useTranslation } from 'react-i18next';

import { useAuth } from '@/core/auth';
import { getUploadQueue, useUploadQueue } from '@/core/native';
import { Button } from '@/core/ui';

import { useOfflineSnapshotRefresh, useUploadPending } from '../api/useWorkoutSync';

/**
 * Lo que `workouts` hace sin pantalla mientras hay sesión (D-143): guardar en
 * el móvil lo necesario para entrenar sin cobertura y subir lo pendiente. Si la
 * base de datos rechaza algo, lo avisa (D-118).
 */
export function WorkoutsService() {
  const { user } = useAuth();
  return user === null ? null : <SyncForUser userId={user.id} />;
}

function SyncForUser({ userId }: { userId: string }) {
  useUploadPending(userId);
  useOfflineSnapshotRefresh(userId);
  return <RejectedUploadsNotice userId={userId} />;
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
      className="bg-surface border-border fixed inset-x-4 bottom-[calc(5rem+var(--safe-bottom))] z-50 mx-auto flex max-w-lg flex-col gap-2 rounded-lg border p-4 shadow-lg lg:bottom-8"
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
