import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { useTenantMembers } from '@/core/tenancy';
import { Avatar, Card, ROW_LINK_CLASS, SECTION_TITLE_CLASS } from '@/core/ui';

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
      <h2 className={SECTION_TITLE_CLASS}>{t('programs.home.alertsTitle')}</h2>
      {alerts.length === 0 ? (
        <p className="text-muted">{t('programs.home.allGood')}</p>
      ) : (
        <ul aria-label={t('programs.home.alertsTitle')} className="-mx-2 flex flex-col">
          {alerts.map((alert) => (
            <li key={alert.clientId}>
              <Link to={`/coach/clients/${alert.clientId}`} className={ROW_LINK_CLASS}>
                <Avatar name={alert.clientName} />
                <span className="flex min-w-0 flex-col">
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
