import type { QueryClient } from '@tanstack/react-query';

import { routinesByClient } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import type { ProgramDocument } from '../model/program-document';
import { fetchClientPrograms } from './assignments-api';
import { fetchProgram } from './programs-api';
import { clientProgramsQueryKey } from './useAssignments';
import { programQueryKey } from './useProgram';

export interface CurrentClientProgram {
  program: ClientProgram;
  document: ProgramDocument;
}

/**
 * Descarga, sin esperar a que nadie abra "Entreno", la rutina vigente del
 * cliente entera (D-118). Se guarda con las mismas claves que usan las
 * pantallas del cliente: así, en la app del móvil, "Entreno" y "Hoy toca" la
 * tienen aunque luego se abran sin conexión. `null` si no tiene rutina vigente.
 */
export async function loadCurrentClientProgram(
  queryClient: QueryClient,
  tenantId: string,
  today: string,
): Promise<CurrentClientProgram | null> {
  const programs = await queryClient.fetchQuery({
    queryKey: clientProgramsQueryKey(tenantId),
    queryFn: () => fetchClientPrograms(tenantId),
    staleTime: 0,
  });
  // El cliente solo lee sus propias rutinas (RLS): hay como mucho un cliente.
  const program = [...routinesByClient(programs, today).values()][0]?.current ?? null;
  if (program === null) {
    return null;
  }
  const document = await queryClient.fetchQuery({
    queryKey: programQueryKey(tenantId, program.id),
    queryFn: () => fetchProgram(tenantId, program.id),
    staleTime: 0,
  });
  return { program, document };
}
