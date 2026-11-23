import type { ClientProgram } from '../model/assignments';
import { clientBlock } from '../model/client-view';
import type { ProgramDocument } from '../model/program-document';
import { BlockOverview } from './BlockOverview';

interface ProgramOverviewProps {
  program: ClientProgram;
  document: ProgramDocument;
  today: string;
}

/**
 * Lo primero que ve el cliente (D-084): con calendario, "Hoy toca" y los días
 * del ciclo con el de hoy marcado; en modo lista, sus días de entreno en
 * orden, sin fechas (D-082). Cualquier día se puede abrir.
 */
export function ProgramOverview({ program, document, today }: ProgramOverviewProps) {
  const current = clientBlock(program, document, today);
  if (current === null) {
    return null;
  }
  return (
    <BlockOverview program={program} documentName={document.name} today={today} {...current} />
  );
}
