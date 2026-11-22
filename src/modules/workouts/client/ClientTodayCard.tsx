import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { canLogWorkouts } from '@/core/native';
import { Button, Card, Icon, buttonClassName } from '@/core/ui';
import { shortDate, useClientToday, useDaySummary, useDayTitle } from '@/modules/programs';
import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { useStartWorkout } from '../api/useStartWorkout';
import { useWorkoutOwnership } from '../api/useWorkoutOwnership';

const TITLE_LINK =
  'focus-ring rounded-md text-2xl leading-tight font-semibold tracking-tight underline-offset-4 hover:underline';

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
      <Card className="flex items-center gap-4">
        <IconBubble name="calendar" />
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
      <Card className="flex items-center gap-4">
        <IconBubble name="clipboard" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="eyebrow">{t('workouts.today.listProgram')}</p>
          <Link to="/client/program" className={TITLE_LINK}>
            {today.program.name}
          </Link>
        </div>
      </Card>
    );
  }
  if (day.kind === 'rest') {
    return (
      <Card className="flex items-center gap-4">
        <IconBubble name="moon" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xl font-semibold tracking-tight">{t('workouts.today.rest')}</p>
          <Link
            to="/client/program"
            className="focus-ring text-primary-readable inline-flex items-center gap-1 self-start rounded-md text-sm font-semibold"
          >
            {t('workouts.today.open')}
            <Icon name="arrowRight" className="size-4" />
          </Link>
        </div>
      </Card>
    );
  }
  return (
    <Card tone="accent" className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="eyebrow text-primary-readable">{t('workouts.today.title')}</p>
          <Link to={`/client/program?day=${String(day.dayNumber)}`} className={TITLE_LINK}>
            {title(day)}
          </Link>
        </div>
        <IconBubble name="dumbbell" tone="primary" />
      </div>
      <p className="numeric text-muted text-sm">{summary({ ...day, name: null })}</p>
      {canLogWorkouts() ? (
        <StartButton start={() => ({ programId: today.program.id, block: today.block, day })} />
      ) : (
        <p className="text-muted flex items-center gap-2 text-sm">
          <Icon name="smartphone" className="size-4 shrink-0" />
          {t('workouts.today.openMobileApp')}
        </p>
      )}
    </Card>
  );
}

/** El icono de la tarjeta, en un círculo: dice de un vistazo qué toca hoy. */
function IconBubble({
  name,
  tone = 'neutral',
}: {
  name: 'calendar' | 'clipboard' | 'moon' | 'dumbbell';
  tone?: 'neutral' | 'primary';
}) {
  return (
    <span
      className={
        tone === 'primary'
          ? 'bg-primary text-on-primary flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_24px_-10px_var(--color-primary-glow)]'
          : 'surface-raised text-muted flex size-12 shrink-0 items-center justify-center rounded-2xl'
      }
    >
      <Icon name={name} className="size-5" />
    </span>
  );
}

type StartArgs = () => { programId: string; block: ProgramBlock; day: ProgramDay };

function StartButton({ start }: { start: StartArgs }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const active = useActiveWorkout();
  const starter = useStartWorkout();
  const ownership = useWorkoutOwnership();
  const open = active.data ?? null;

  // Con uno abierto en otro móvil tampoco se empieza otro (D-119, D-124).
  if (open !== null || ownership.kind === 'elsewhere') {
    return (
      <Link to="/client/workout" className={buttonClassName('primary', 'w-full', 'lg')}>
        <Icon name="play" className="size-5" />
        {t('workouts.today.continue')}
      </Link>
    );
  }
  return (
    <Button
      size="lg"
      className="w-full"
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
      <Icon name="play" className="size-5" />
      {t('workouts.today.start')}
    </Button>
  );
}
