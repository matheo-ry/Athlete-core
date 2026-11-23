import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { canLogWorkouts } from '@/core/native';
import { Button, Card, buttonClassName } from '@/core/ui';
import { shortDate, useClientToday, useDaySummary, useDayTitle } from '@/modules/programs';
import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { useStartWorkout } from '../api/useStartWorkout';
import { useWorkoutOwnership } from '../api/useWorkoutOwnership';

const LINK = 'focus-ring rounded-md underline-offset-[6px] decoration-2 hover:underline';

/** La tarjeta va encima de la foto del inicio: cristal oscuro y texto blanco (D-prime1-7). */
function HeroCard({ children }: { children: ReactNode }) {
  return (
    <Card tone="photo" className="animate-enter flex flex-col gap-5 p-6">
      {children}
    </Card>
  );
}

/** El botón principal a todo el ancho, con la flecha en su círculo. */
// Con `!`: `cn` no resuelve choques y el botón base centra el contenido.
const START_CLASS = 'w-full justify-between! pr-2! pl-6!';

function StartArrow() {
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-scrim/15">
      <ArrowRight aria-hidden="true" className="size-5" />
    </span>
  );
}

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
      <HeroCard>
        <p className="display text-2xl">
          {today.next === null
            ? t('workouts.today.noProgram')
            : t('workouts.today.startsOn', { date: shortDate(today.next.startsOn, language) })}
        </p>
      </HeroCard>
    );
  }
  const day = today.today;
  if (day === null) {
    // Modo lista: sin "Hoy toca" (D-082).
    return (
      <HeroCard>
        <p className="eyebrow text-on-photo-muted">{t('workouts.today.listProgram')}</p>
        <Link to="/client/program" className={`${LINK} display text-4xl`}>
          {today.program.name}
        </Link>
      </HeroCard>
    );
  }
  if (day.kind === 'rest') {
    return (
      <HeroCard>
        <p className="display text-4xl">{t('workouts.today.rest')}</p>
        <Link
          to="/client/program"
          className={buttonClassName('secondary', `${START_CLASS} text-on-photo`, 'lg')}
        >
          {t('workouts.today.open')}
          <StartArrow />
        </Link>
      </HeroCard>
    );
  }
  return (
    <HeroCard>
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-on-photo-muted">{t('workouts.today.title')}</p>
        <Link
          to={`/client/program?day=${String(day.dayNumber)}`}
          className={`${LINK} display text-[2.6rem] break-words`}
        >
          {title(day)}
        </Link>
        <p className="text-on-photo-muted text-[0.9375rem]">{summary({ ...day, name: null })}</p>
      </div>
      {canLogWorkouts() ? (
        <StartButton start={() => ({ programId: today.program.id, block: today.block, day })} />
      ) : (
        <p className="text-on-photo-muted rounded-2xl bg-on-photo/5 px-4 py-3 text-sm">
          {t('workouts.today.openMobileApp')}
        </p>
      )}
    </HeroCard>
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
      <Link to="/client/workout" className={buttonClassName('primary', START_CLASS, 'lg')}>
        {t('workouts.today.continue')}
        <StartArrow />
      </Link>
    );
  }
  return (
    <Button
      size="lg"
      className={START_CLASS}
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
      <StartArrow />
    </Button>
  );
}
