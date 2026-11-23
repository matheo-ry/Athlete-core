import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { logger } from '@/core/lib';
import { onAppResume } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import type { ClientProgram } from '../model/assignments';
import { calculateMissedDaysToSync } from '../model/calendar';
import type { ProgramDocument } from '../model/program-document';
import { recordMissedDays } from './assignments-api';
import { clientProgramsQueryKey } from './useAssignments';

/**
 * La app del cliente, al abrirse o volver a primer plano, apunta los días de entreno
 * faltados desde la última vez (PR 3.2b, PR 3.12, D-105, D-125), con la fecha del móvil.
 */
export function useSyncMissedDays(
  program: ClientProgram | null | undefined,
  document: ProgramDocument | null | undefined,
  today: string,
) {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!program || program.mode !== 'calendar' || !document || !tenantId) {
      return;
    }

    const sync = async () => {
      if (isSyncingRef.current || !navigator.onLine) {
        return;
      }
      isSyncingRef.current = true;
      try {
        const toRecord = calculateMissedDaysToSync(program, document, today);
        if (toRecord.length > 0) {
          const batch = toRecord.slice(0, 100).map((item) => ({
            program_day_id: item.program_day_id,
            missed_on: item.missed_on,
          }));
          const result = await recordMissedDays(tenantId, program.id, batch, today);
          if (result.status === 'done') {
            await queryClient.invalidateQueries({
              queryKey: clientProgramsQueryKey(tenantId),
            });
          } else {
            logger.warn('Could not record missed days', { status: result.status });
          }
        }
      } catch (error) {
        logger.error('Failed to sync missed days', {
          message: error instanceof Error ? error.message : 'unknown',
        });
      } finally {
        isSyncingRef.current = false;
      }
    };

    void sync();
    const unsubscribe = onAppResume(() => {
      void sync();
    });
    return () => {
      unsubscribe();
    };
  }, [program, document, today, tenantId, queryClient]);
}
