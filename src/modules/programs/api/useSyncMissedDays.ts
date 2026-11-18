import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { onAppResume } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import type { ClientProgram } from '../model/assignments';
import { addDays, calendarPosition, daysBetween } from '../model/calendar';
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
    if (daysBetween(program.startsOn, today) <= 0) {
      return;
    }

    const sync = async () => {
      if (isSyncingRef.current || !navigator.onLine) {
        return;
      }
      isSyncingRef.current = true;
      try {
        const yesterday = addDays(today, -1);
        const recordedMissed = new Set(program.missedDays?.map((m) => m.missedOn) ?? []);
        const performedDates = new Set(
          program.workouts
            ?.filter((w) => w.closedAt !== null && w.performedOn)
            .map((w) => w.performedOn!) ?? [],
        );

        const toRecord: Array<{ program_day_id: string; missed_on: string }> = [];
        let cur = program.startsOn;

        // Limitar a los últimos 60 días para evitar bucles largos si la rutina es muy antigua
        const minDate = addDays(today, -60);
        if (cur < minDate) {
          cur = minDate;
        }

        while (cur <= yesterday) {
          if (!recordedMissed.has(cur) && !performedDates.has(cur)) {
            const pos = calendarPosition(
              program.blocks,
              program.startsOn,
              cur,
              program.startBlockId,
              {
                rules: program.missedDayRules,
                missedDays: program.missedDays,
              },
            );
            if (pos.status === 'running') {
              const day = document.blocks[pos.blockIndex]?.days.find(
                (d) => d.dayNumber === pos.dayNumber,
              );
              if (day?.kind === 'training' && day.id !== null) {
                toRecord.push({ program_day_id: day.id, missed_on: cur });
              }
            }
          }
          cur = addDays(cur, 1);
        }

        if (toRecord.length > 0) {
          // La base de datos acepta hasta 100 días por llamada
          const batch = toRecord.slice(0, 100);
          const result = await recordMissedDays(tenantId, program.id, batch, today);
          if (result.status === 'done') {
            await queryClient.invalidateQueries({
              queryKey: clientProgramsQueryKey(tenantId),
            });
          }
        }
      } catch {
        // En caso de fallo de red, se reintentará en el próximo resume
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
