import { Spinner } from '@/core/ui';

import { useProgram } from '../api/useProgram';
import type { ClientProgram } from '../model/assignments';
import { calendarPosition } from '../model/calendar';
import { BlockDays } from './BlockDays';

interface CurrentProgramDaysProps {
  program: ClientProgram;
  today: string;
}

/**
 * Los días del bloque en que va el cliente, en lectura (PR 2.14). Con
 * calendario, el de hoy va marcado.
 */
export function CurrentProgramDays({ program, today }: CurrentProgramDaysProps) {
  const document = useProgram(program.id);
  const options = {
    rules: program.missedDayRules,
    missedDays: program.missedDays,
    completedWorkouts: program.completedWorkoutsCount,
  };
  const position = calendarPosition(
    program.blocks,
    program.startsOn,
    today,
    program.startBlockId,
    options,
  );
  const blockIndex = position.status === 'running' ? position.blockIndex : 0;
  const block = document.data?.blocks[blockIndex] ?? document.data?.blocks[0];

  if (document.isPending) {
    return <Spinner />;
  }
  if (block === undefined) {
    return null;
  }
  const todayNumber =
    program.mode === 'calendar' && position.status === 'running' ? position.dayNumber : null;

  return (
    <BlockDays
      block={block}
      todayNumber={todayNumber}
      program={program}
      blockIndex={blockIndex}
      lap={position.status === 'running' ? position.lap : 1}
      today={today}
    />
  );
}
