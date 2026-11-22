import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import type { Language } from '@/core/i18n';
import { useTenantMembers } from '@/core/tenancy';
import { Card, Pill } from '@/core/ui';

import { useCoachActivity } from '../api/useCoachActivity';
import {
  countNotes,
  countRecords,
  countReplacements,
  getOpenedWorkoutIds,
  markWorkoutOpened,
} from '../model/workout-activity';
import type { WorkoutActivityRecord } from '../model/workout-activity';

const FIRST_MONDAY = Date.UTC(2024, 0, 1);

function formatDayName(dayNumber: number, customName: string | null, language: Language): string {
  if (customName !== null && customName.trim().length > 0) {
    return customName;
  }
  if (dayNumber >= 1 && dayNumber <= 7) {
    const name = new Intl.DateTimeFormat(language, {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(FIRST_MONDAY + (dayNumber - 1) * 86_400_000);
    return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
  }
  return `Día ${dayNumber}`;
}

/**
 * Tarjeta "Actividad" en el inicio del coach (PR 3.14, D-114, D-128).
 * Lo último arriba: "Ana terminó Lunes · 2 récords · cambió 1 ejercicio · 1 nota".
 * Lo no abierto, marcado; al abrirlo deja de estarlo. Cada línea lleva al entreno.
 */
export function CoachActivityCard() {
  const { t } = useTranslation();
  const language = useLanguage();
  const members = useTenantMembers();
  const activityQuery = useCoachActivity();
  const [openedIds, setOpenedIds] = useState(() => getOpenedWorkoutIds());

  const clientsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members.data ?? []) {
      if (member.role === 'client' && member.status === 'active') {
        map.set(member.userId, member.displayName);
      }
    }
    return map;
  }, [members.data]);

  if (!members.isSuccess || !activityQuery.isSuccess) {
    return null;
  }

  // Filtrar solo los entrenos de clientes activos de este negocio.
  const activeWorkouts = activityQuery.data.filter((w) => clientsById.has(w.clientId));

  const handleOpenWorkout = (workoutId: string) => {
    markWorkoutOpened(workoutId);
    setOpenedIds((prev) => {
      const next = new Set(prev);
      next.add(workoutId);
      return next;
    });
  };

  const renderWorkoutLine = (
    workout: WorkoutActivityRecord,
    allWorkouts: readonly WorkoutActivityRecord[],
  ) => {
    const clientName = clientsById.get(workout.clientId) ?? '';
    const dayName = formatDayName(workout.dayNumber, workout.dayName, language);
    const priorWorkouts = allWorkouts.filter(
      (w) =>
        w.clientId === workout.clientId &&
        (w.performedOn < workout.performedOn ||
          (w.performedOn === workout.performedOn && w.id !== workout.id)),
    );

    const recordsCount = countRecords(workout, priorWorkouts);
    const replacementsCount = countReplacements(workout);
    const notesCount = countNotes(workout);

    const parts: string[] = [t('workouts.home.finishedDay', { clientName, dayName })];
    if (recordsCount > 0) {
      parts.push(t('workouts.home.records', { count: recordsCount }));
    }
    if (replacementsCount > 0) {
      parts.push(t('workouts.home.changedExercises', { count: replacementsCount }));
    }
    if (notesCount > 0) {
      parts.push(t('workouts.home.notes', { count: notesCount }));
    }

    const isNew = !openedIds.has(workout.id);

    return (
      <li key={workout.id}>
        <Link
          to={`/coach/clients/${workout.clientId}?workout=${workout.id}`}
          onClick={() => handleOpenWorkout(workout.id)}
          className="focus-ring hover:bg-foreground/5 flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition-colors"
        >
          <span
            aria-hidden="true"
            className="bg-primary-soft text-primary-readable ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1"
          >
            {brandInitials(clientName)}
          </span>
          <span className="min-w-0 flex-1 text-sm leading-6 font-medium break-words">
            {parts.join(' · ')}
          </span>
          {isNew ? <Pill tone="primary">{t('workouts.home.newBadge')}</Pill> : null}
        </Link>
      </li>
    );
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('workouts.home.activityTitle')}</h2>
      {activeWorkouts.length === 0 ? (
        <p className="text-muted">{t('workouts.home.noActivity')}</p>
      ) : (
        <ul aria-label={t('workouts.home.activityTitle')}>
          {activeWorkouts.map((workout) => renderWorkoutLine(workout, activeWorkouts))}
        </ul>
      )}
    </Card>
  );
}
