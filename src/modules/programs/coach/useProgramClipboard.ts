import { useEffect, useState } from 'react';

import { useAuth } from '@/core/auth';
import { useTenancy } from '@/core/tenancy';

import { readClipboard, writeClipboard } from '../model/program-clipboard';
import type { ProgramClipboard } from '../model/program-clipboard';

// Las piezas del editor que enseñan "Pegar" se enteran al copiar algo.
const listeners = new Set<() => void>();

/**
 * Lo copiado en el editor (PR 2.11): un ejercicio o un día, para pegarlo en
 * otro día o en otra rutina del mismo negocio. Vive en el dispositivo y se
 * olvida al cerrar sesión.
 */
export function useProgramClipboard() {
  const userId = useAuth().user?.id ?? null;
  const tenantId = useTenancy().tenant?.id ?? null;
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  // `version` solo fuerza a volver a leer cuando alguien copia.
  const clipboard =
    version >= 0 && userId !== null && tenantId !== null ? readClipboard(userId, tenantId) : null;

  return {
    clipboard,
    copy: (content: ProgramClipboard) => {
      if (userId === null || tenantId === null) {
        return;
      }
      writeClipboard(userId, tenantId, content);
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
