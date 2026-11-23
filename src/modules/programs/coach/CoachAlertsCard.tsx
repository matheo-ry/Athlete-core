import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { useTenantMembers } from '@/core/tenancy';
import { Card } from '@/core/ui';

import { useClientPrograms } from '../api/useAssignments';
import { useWorkoutAlerts } from '../api/useWorkoutAlerts';
import { routinesByClient } from '../model/assignments';
import { localToday } from '../model/calendar';
import { coachAlerts } from '../model/coach-alerts';
import type { CoachAlert } from '../model/coach-alerts';
import { shortDate } from '../shared/useProgressText';

/**
 * La tarjeta de avisos del inicio del coach (PR 2.18, D-085, D-128): clientes sin
 * rutina, sin entrenar desde hace 7 días, con 3 cambios del mismo ejercicio,
 * o con la rutina a punto de acabar o ya repitiéndose. Cada línea lleva a la
 * ficha del cliente. Sin clientes todavía, no sale: de eso se ocupan los primeros pasos.
 */
export function CoachAlertsCard() {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const members = useTenantMembers();
  const programs = useClientPrograms();
  const workoutAlerts = useWorkoutAlerts(today);

  if (!members.isSuccess || !programs.isSuccess || !workoutAlerts.isSuccess) {
    // Cargando o con error: el inicio no se llena de avisos a medias.
    return null;
  }
  const clients = members.data.filter(
    (member) => member.role === 'client' && member.status === 'active',
  );
  if (clients.length === 0) {
    return null;
  }
  const alerts = coachAlerts(
    clients,
    routinesByClient(programs.data, today),
    today,
    workoutAlerts.data,
  );
  const detail = (alert: CoachAlert) => {
    switch (alert.kind) {
      case 'endsSoon':
        return t('programs.home.endsOn', { date: shortDate(alert.endsOn, language) });
      case 'notTrained':
        return t('programs.home.notTrained', { days: alert.days });
      case 'exerciseChanged':
        return t('programs.home.exerciseChanged', {
          exerciseName: alert.exerciseName,
          times: alert.times,
        });
      default:
        return t(`programs.home.${alert.kind}`);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('programs.home.alertsTitle')}</h2>
      {alerts.length === 0 ? (
        <p className="text-muted">{t('programs.home.allGood')}</p>
      ) : (
        <ul aria-label={t('programs.home.alertsTitle')}>
          {alerts.map((alert) => (
            <li key={alert.clientId}>
              <Link
                to={`/coach/clients/${alert.clientId}`}
                className="focus-ring hover:bg-foreground/5 flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition-colors"
              >
                <span aria-hidden="true" className="relative">
                  <span className="bg-primary-soft text-primary-readable ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1">
                    {brandInitials(alert.clientName)}
                  </span>
                  <span className="bg-accent ring-surface absolute -top-0.5 -right-0.5 size-3 rounded-full ring-2" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold break-words">{alert.clientName}</span>
                  <span className="text-muted text-sm">{detail(alert)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
