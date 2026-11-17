import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { canLogWorkouts } from '@/core/native';
import { Button, Card, buttonClassName } from '@/core/ui';
import { shortDate, useClientToday, useDaySummary, useDayTitle } from '@/modules/programs';
import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { useStartWorkout } from '../api/useStartWorkout';

const LINK =
  'focus-visible:outline-primary-readable rounded text-lg font-semibold underline-offset-4 hover:underline focus-visible:outline-2';

/**
 * La tarjeta del inicio del cliente (PR 2.18, D-084), de `workouts` desde el
 * PR 3.5 (D-119): "Hoy toca" con "Iniciar entreno" (o "Continuar" si hay uno
 * abierto), "Hoy: descanso" o el estado de su rutina. En la web, en vez del
 * botón, "Para entrenar, abre la app en tu móvil" (D-116).
 */
export function ClientTodayCard() {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useClientToday();
  const title = useDayTitle(today.status === 'ready' ? today.block : undefined);
  const summary = useDaySummary();

  if (today.status === 'loading') {
    return null;
  }
  if (today.status === 'none') {
    return (
      <Card>
        <p className="font-semibold">
          {today.next === null
            ? t('workouts.today.noProgram')
            : t('workouts.today.startsOn', { date: shortDate(today.next.startsOn, language) })}
        </p>
      </Card>
    );
  }
  const day = today.today;
  if (day === null) {
    // Modo lista: sin "Hoy toca" (D-082).
    return (
      <Card className="flex flex-col gap-1">
        <p className="text-muted text-sm">{t('workouts.today.listProgram')}</p>
        <Link to="/client/program" className={LINK}>
          {today.program.name}
        </Link>
      </Card>
    );
  }
  if (day.kind === 'rest') {
    return (
      <Card className="flex flex-col gap-1">
        <p className="text-lg font-semibold">{t('workouts.today.rest')}</p>
        <Link to="/client/program" className={LINK}>
          {t('workouts.today.open')}
        </Link>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-muted text-sm">{t('workouts.today.title')}</p>
      <Link to={`/client/program?day=${String(day.dayNumber)}`} className={LINK}>
        {title(day)}
      </Link>
      <p className="text-sm">{summary({ ...day, name: null })}</p>
      {canLogWorkouts() ? (
        <StartButton start={() => ({ programId: today.program.id, block: today.block, day })} />
      ) : (
        <p className="text-muted text-sm">{t('workouts.today.openMobileApp')}</p>
      )}
    </Card>
  );
}

type StartArgs = () => { programId: string; block: ProgramBlock; day: ProgramDay };

function StartButton({ start }: { start: StartArgs }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const active = useActiveWorkout();
  const starter = useStartWorkout();
  const open = active.data ?? null;

  if (open !== null) {
    return (
      <Link to="/client/workout" className={buttonClassName('primary', 'mt-2 self-start')}>
        {t('workouts.today.continue')}
      </Link>
    );
  }
  return (
    <Button
      className="mt-2 self-start"
      disabled={!starter.isReady || starter.isPending}
      onClick={() => {
        const { programId, block, day } = start();
        void starter.start(programId, block, day).then((workout) => {
          if (workout !== null) {
            void navigate('/client/workout');
          }
        });
      }}
    >
      {t('workouts.today.start')}
    </Button>
  );
}
