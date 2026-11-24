import { useSearchParams } from 'react-router';

import { ErrorState, SkeletonCard } from '@/core/ui';

import { useProgram } from '../api/useProgram';
import type { ClientProgram } from '../model/assignments';
import { ClientDayView } from './ClientDayView';
import { ClientExerciseView } from './ClientExerciseView';
import { ProgramOverview } from './ProgramOverview';

interface CurrentProgramViewProps {
  program: ClientProgram;
  today: string;
}

/** La rutina vigente del cliente: el resumen, un día o un ejercicio, según la dirección. */
export function CurrentProgramView({ program, today }: CurrentProgramViewProps) {
  const document = useProgram(program.id);
  const [params] = useSearchParams();
  const dayNumber = Number(params.get('day') ?? '');
  const exerciseIndex = Number(params.get('exercise') ?? '');

  if (document.isPending) {
    return <SkeletonCard />;
  }
  if (document.isError) {
    return <ErrorState onRetry={() => void document.refetch()} />;
  }
  if (Number.isInteger(dayNumber) && dayNumber > 0) {
    if (Number.isInteger(exerciseIndex) && exerciseIndex > 0) {
      return (
        <ClientExerciseView
          program={program}
          document={document.data}
          today={today}
          dayNumber={dayNumber}
          position={exerciseIndex}
        />
      );
    }
    return (
      <ClientDayView
        program={program}
        document={document.data}
        today={today}
        dayNumber={dayNumber}
      />
    );
  }
  return <ProgramOverview program={program} document={document.data} today={today} />;
}
