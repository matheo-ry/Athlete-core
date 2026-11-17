import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { useLanguage } from '@/core/i18n';
import { getSupabaseClient } from '@/core/supabase';
import { useTenancy } from '@/core/tenancy';

import { daysBetween } from '../model/calendar';
import type { ClientWorkoutAlerts } from '../model/coach-alerts';

export function workoutAlertsQueryKey(tenantId: string | null) {
  return ['programs', 'workout-alerts', tenantId] as const;
}

const workoutRowSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  performed_on: z.string(),
});

const replacementWorkoutRelationSchema = z
  .union([
    z.object({ client_id: z.string(), performed_on: z.string() }),
    z.array(z.object({ client_id: z.string(), performed_on: z.string() })),
  ])
  .nullable()
  .optional();

const replacementRowSchema = z.object({
  workout_id: z.string(),
  replaces_exercise_id: z.string().nullable(),
  workouts: replacementWorkoutRelationSchema,
});

const libraryRelationSchema = z
  .union([
    z.object({ name_es: z.string().nullable(), name_en: z.string().nullable() }),
    z.array(z.object({ name_es: z.string().nullable(), name_en: z.string().nullable() })),
  ])
  .nullable()
  .optional();

const exerciseRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  exercise_library: libraryRelationSchema,
});

function daysAgo(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export async function fetchWorkoutAlertData(
  tenantId: string,
  today: string,
  language: string,
): Promise<Map<string, ClientWorkoutAlerts>> {
  const supabase = getSupabaseClient();
  const resultMap = new Map<string, ClientWorkoutAlerts>();

  // 1. Días desde el último entreno por cliente.
  const { data: workouts, error: wError } = await supabase
    .from('workouts')
    .select('id, client_id, performed_on')
    .eq('tenant_id', tenantId)
    .not('closed_at', 'is', null)
    .order('performed_on', { ascending: false });

  if (wError !== null) {
    throw new Error(`Could not load client workouts for alerts: ${wError.code}`);
  }

  const parsedWorkouts = z.array(workoutRowSchema).parse(workouts ?? []);

  // Agrupar el último entreno de cada cliente
  for (const w of parsedWorkouts) {
    if (!resultMap.has(w.client_id)) {
      const days = daysBetween(w.performed_on, today);
      resultMap.set(w.client_id, {
        daysSinceLastWorkout: days,
        exerciseReplacement: null,
      });
    }
  }

  // 2. Ejercicios cambiados 3 veces en 4 semanas (28 días)
  const fourWeeksAgo = daysAgo(today, 28);
  const { data: replacements, error: rError } = await supabase
    .from('workout_exercises')
    .select(
      `
      workout_id,
      replaces_exercise_id,
      workouts!inner ( client_id, performed_on )
    `,
    )
    .eq('tenant_id', tenantId)
    .not('replaces_exercise_id', 'is', null)
    .gte('workouts.performed_on', fourWeeksAgo);

  if (rError !== null) {
    throw new Error(`Could not load exercise replacements for alerts: ${rError.code}`);
  }

  const parsedReplacements = z.array(replacementRowSchema).parse(replacements ?? []);

  const replacedExerciseIds = [
    ...new Set(
      parsedReplacements
        .map((r) => r.replaces_exercise_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const exerciseNames = new Map<string, string>();
  if (replacedExerciseIds.length > 0) {
    const { data: exRows } = await supabase
      .from('exercises')
      .select('id, name, exercise_library ( name_es, name_en )')
      .in('id', replacedExerciseIds);

    const parsedExRows = z.array(exerciseRowSchema).parse(exRows ?? []);

    for (const row of parsedExRows) {
      const lib = Array.isArray(row.exercise_library)
        ? row.exercise_library[0]
        : row.exercise_library;
      const libName = language === 'es' ? lib?.name_es : lib?.name_en;
      exerciseNames.set(row.id, row.name || libName || 'ejercicio');
    }
  }

  // Contar cuántos entrenos distintos cambiaron cada ejercicio por cliente
  const clientExerciseCounts = new Map<string, Map<string, Set<string>>>();
  for (const r of parsedReplacements) {
    const rawWorkout = Array.isArray(r.workouts) ? r.workouts[0] : r.workouts;
    const clientId = rawWorkout?.client_id;
    const exId = r.replaces_exercise_id;
    if (!clientId || !exId) continue;

    let exMap = clientExerciseCounts.get(clientId);
    if (!exMap) {
      exMap = new Map();
      clientExerciseCounts.set(clientId, exMap);
    }
    let workoutSet = exMap.get(exId);
    if (!workoutSet) {
      workoutSet = new Set();
      exMap.set(exId, workoutSet);
    }
    workoutSet.add(r.workout_id);
  }

  for (const [clientId, exMap] of clientExerciseCounts) {
    for (const [exId, workoutSet] of exMap) {
      if (workoutSet.size >= 3) {
        const exName = exerciseNames.get(exId) ?? 'ejercicio';
        const existing = resultMap.get(clientId) ?? {
          daysSinceLastWorkout: null,
          exerciseReplacement: null,
        };
        existing.exerciseReplacement = {
          exerciseName: exName,
          times: workoutSet.size,
        };
        resultMap.set(clientId, existing);
        break; // Un aviso de cambio de ejercicio por cliente como mucho
      }
    }
  }

  return resultMap;
}

/** Datos de entrenos de los clientes para alimentar los avisos del coach (D-128). */
export function useWorkoutAlerts(today: string) {
  const { tenant } = useTenancy();
  const language = useLanguage();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: [...workoutAlertsQueryKey(tenantId), today, language],
    queryFn: () => fetchWorkoutAlertData(tenantId ?? '', today, language),
    enabled: tenantId !== null,
  });
}
