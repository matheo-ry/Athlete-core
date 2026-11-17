import { useEffect, useState } from 'react';

import { getUploadQueue } from './upload-queue';
import type { UploadItem } from './upload-queue';

const EMPTY: readonly UploadItem[] = [];

/**
 * Lo que este usuario tiene en la cola, al día: lo pendiente de subir (para
 * "Pendiente de subir" y para preguntar al cerrar sesión, D-118) y lo rechazado.
 */
export function useUploadQueue(userId: string | null): readonly UploadItem[] {
  // Con el usuario al que pertenece: al cambiar de cuenta no se ve la cola de la anterior.
  const [loaded, setLoaded] = useState<{ userId: string; items: readonly UploadItem[] } | null>(
    null,
  );

  useEffect(() => {
    if (userId === null) {
      return undefined;
    }
    const queue = getUploadQueue();
    let active = true;
    const load = async () => {
      const items = await queue.list(userId);
      if (active) {
        setLoaded({ userId, items });
      }
    };
    void load();
    const unsubscribe = queue.subscribe(() => void load());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  return loaded !== null && loaded.userId === userId ? loaded.items : EMPTY;
}
