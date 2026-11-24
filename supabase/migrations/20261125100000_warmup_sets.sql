-- =====================================================================
-- Migración 24: series de calentamiento (Fase 3, PR 3.19; D-ideas-2)
--
-- 1. Interruptor en `profiles`: `warmup_sets_enabled` (false por defecto).
-- 2. Columna `workout_sets.is_warmup` (false por defecto), clave única
--    `(workout_exercise_id, is_warmup, set_number, side)` y reglas:
--    1..5, sin lado (`none`), sin `is_extra` y sin intensidad.
-- 3. `sync_workout` acepta `is_warmup`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. INTERRUPTOR EN PROFILES
-- ---------------------------------------------------------------------
alter table public.profiles
  add column warmup_sets_enabled boolean not null default false;

grant update (warmup_sets_enabled)
  on public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 2. COLUMNA Y RESTRICCIONES EN WORKOUT_SETS
-- ---------------------------------------------------------------------
alter table public.workout_sets
  add column is_warmup boolean not null default false,
  drop constraint workout_sets_workout_exercise_id_set_number_side_key,
  add constraint workout_sets_exercise_warmup_set_side_key
    unique (workout_exercise_id, is_warmup, set_number, side),
  add constraint workout_sets_warmup_rules check (
    not is_warmup or (
      set_number between 1 and 5
      and side = 'none'
      and not is_extra
      and intensity_type is null
      and intensity_value is null
    )
  );


-- ---------------------------------------------------------------------
-- 3. SYNC_WORKOUT ACEPTA `is_warmup`
-- ---------------------------------------------------------------------
create or replace function public.sync_workout(p_tenant uuid, p_workout jsonb)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id         uuid        := (p_workout ->> 'id')::uuid;
  v_started    timestamptz := (p_workout ->> 'started_at')::timestamptz;
  v_changed    timestamptz := (p_workout ->> 'last_changed_at')::timestamptz;
  v_closed     timestamptz := (p_workout ->> 'closed_at')::timestamptz;
  v_since      timestamptz := (p_workout ->> 'device_since')::timestamptz;
  v_performed  date        := (p_workout ->> 'performed_on')::date;
  v_note       text        := nullif(btrim(p_workout ->> 'note'), '');
  v_items      jsonb       := coalesce(p_workout -> 'exercises', '[]'::jsonb);
  -- Un día de margen por si el reloj del móvil va adelantado.
  v_limit      timestamptz := now() + interval '1 day';
  v_stored     public.workouts;
  v_new        public.workouts;
  v_program    uuid;
  v_changes    int := 0;
  v_rows       int;
  v_item       jsonb;
  v_item_id    uuid;
  v_exercise   public.exercises;
  v_set        jsonb;
  v_side       text;
  v_is_warmup  boolean;
begin
  if not public.is_member(p_tenant, array['client']) then
    raise exception 'not_allowed';
  end if;
  if v_id is null or v_started is null or v_changed is null or v_performed is null
     or greatest(v_started, v_changed, v_closed, v_since) > v_limit
     or v_performed not between (v_started at time zone 'utc')::date - 1
                            and (now() at time zone 'utc')::date + 1
     or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) > 30 then
    raise exception 'invalid_workout';
  end if;

  select * into v_stored from public.workouts where id = v_id for update;
  if found and (v_stored.tenant_id <> p_tenant or v_stored.client_id <> auth.uid()) then
    raise exception 'not_allowed';
  end if;

  if v_stored.id is null then
    v_program := (p_workout ->> 'program_id')::uuid;
    if not exists (select 1 from public.programs
                   where id = v_program and tenant_id = p_tenant and client_id = auth.uid()) then
      raise exception 'program_not_found';
    end if;
    v_new.block_id := (select id from public.program_blocks
                       where id = (p_workout ->> 'block_id')::uuid and program_id = v_program);
    v_new.program_day_id := (select id from public.program_days
                             where id = (p_workout ->> 'program_day_id')::uuid
                               and program_id = v_program and block_id = v_new.block_id);
    insert into public.workouts
      (id, tenant_id, client_id, program_id, block_id, program_day_id, day_number, performed_on,
       started_at, last_changed_at, closed_at, close_reason, open_device_id, device_since, note)
    values (v_id, p_tenant, auth.uid(), v_program, v_new.block_id, v_new.program_day_id,
            (p_workout ->> 'day_number')::int, v_performed, v_started, v_changed, v_closed,
            p_workout ->> 'close_reason',
            case when v_closed is null then nullif(p_workout ->> 'device_id', '') end,
            case when v_closed is null then v_since end,
            v_note);
    v_changes := 1;
  else
    v_program := v_stored.program_id;
    v_new := v_stored;
    v_new.started_at := least(v_stored.started_at, v_started);
    if v_changed > v_stored.last_changed_at then
      v_new.performed_on := v_performed;
      v_new.last_changed_at := v_changed;
      if p_workout ? 'note' then
        v_new.note := v_note;
      end if;
    end if;
    if v_since > coalesce(v_stored.device_since, '-infinity') then
      v_new.open_device_id := nullif(p_workout ->> 'device_id', '');
      v_new.device_since := v_since;
    end if;
    if v_stored.closed_at is null and v_closed is not null then
      v_new.closed_at := v_closed;
      v_new.close_reason := p_workout ->> 'close_reason';
    end if;
    if v_new.closed_at is not null then
      v_new.open_device_id := null;
      v_new.device_since := null;
    end if;
    if (v_new.started_at, v_new.performed_on, v_new.last_changed_at, v_new.closed_at,
        v_new.close_reason, v_new.open_device_id, v_new.device_since, v_new.note)
       is distinct from
       (v_stored.started_at, v_stored.performed_on, v_stored.last_changed_at, v_stored.closed_at,
        v_stored.close_reason, v_stored.open_device_id, v_stored.device_since, v_stored.note) then
      update public.workouts
      set started_at = v_new.started_at, performed_on = v_new.performed_on,
          last_changed_at = v_new.last_changed_at, closed_at = v_new.closed_at,
          close_reason = v_new.close_reason, open_device_id = v_new.open_device_id,
          device_since = v_new.device_since, note = v_new.note
      where id = v_id;
      v_changes := 1;
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(v_items) loop
    v_item_id := (v_item ->> 'id')::uuid;
    select * into v_exercise from public.exercises
    where id = (v_item ->> 'exercise_id')::uuid and tenant_id = p_tenant;
    if not found then
      raise exception 'exercise_not_found';
    end if;
    if (v_item ->> 'changed_at')::timestamptz > v_limit then
      raise exception 'invalid_workout';
    end if;

    insert into public.workout_exercises as we
      (id, tenant_id, workout_id, position, exercise_id, program_day_exercise_id, superset_group,
       prescribed_sets, prescribed_rest_seconds, coach_note, is_skipped, replaces_exercise_id,
       day_note, changed_at)
    values (
      v_item_id, p_tenant, v_id, (v_item ->> 'position')::int, v_exercise.id,
      (select id from public.program_day_exercises
       where id = (v_item ->> 'program_day_exercise_id')::uuid and program_id = v_program),
      (v_item ->> 'superset_group')::int,
      coalesce(v_item -> 'prescribed_sets', '[]'::jsonb),
      (v_item ->> 'prescribed_rest_seconds')::int,
      nullif(btrim(v_item ->> 'coach_note'), ''),
      coalesce((v_item ->> 'is_skipped')::boolean, false),
      (v_item ->> 'replaces_exercise_id')::uuid,
      nullif(btrim(v_item ->> 'day_note'), ''),
      (v_item ->> 'changed_at')::timestamptz)
    on conflict (id) do update
    set position = excluded.position, exercise_id = excluded.exercise_id,
        program_day_exercise_id = excluded.program_day_exercise_id,
        superset_group = excluded.superset_group, prescribed_sets = excluded.prescribed_sets,
        prescribed_rest_seconds = excluded.prescribed_rest_seconds,
        coach_note = excluded.coach_note, is_skipped = excluded.is_skipped,
        replaces_exercise_id = excluded.replaces_exercise_id, day_note = excluded.day_note,
        changed_at = excluded.changed_at
    where we.workout_id = excluded.workout_id and we.changed_at < excluded.changed_at;
    get diagnostics v_rows = row_count;
    v_changes := v_changes + v_rows;
    if not exists (select 1 from public.workout_exercises where id = v_item_id and workout_id = v_id) then
      raise exception 'invalid_reference';
    end if;

    for v_set in select value from jsonb_array_elements(coalesce(v_item -> 'sets', '[]'::jsonb)) loop
      v_side := coalesce(v_set ->> 'side', 'none');
      v_is_warmup := coalesce((v_set ->> 'is_warmup')::boolean, false);
      -- El calentamiento no va por lado (D-ideas-2); las efectivas sí en unilaterales (D-121).
      if v_is_warmup then
        if v_side <> 'none' then
          raise exception 'invalid_side';
        end if;
      else
        if (v_side = 'none') = v_exercise.is_unilateral then
          raise exception 'invalid_side';
        end if;
      end if;
      -- Lo apuntado tiene que casar con la forma de medir (D-072).
      if (v_exercise.measurement in ('weight_reps','bodyweight_reps')
            and num_nonnulls(v_set ->> 'duration_seconds', v_set ->> 'distance_meters') > 0)
         or (v_exercise.measurement = 'time'
            and num_nonnulls(v_set ->> 'reps', v_set ->> 'distance_meters') > 0)
         or (v_exercise.measurement = 'distance'
            and num_nonnulls(v_set ->> 'reps', v_set ->> 'duration_seconds') > 0) then
        raise exception 'invalid_set_value';
      end if;
      if (v_set ->> 'recorded_at')::timestamptz > v_limit then
        raise exception 'invalid_workout';
      end if;

      insert into public.workout_sets as ws
        (id, tenant_id, workout_id, workout_exercise_id, set_number, side, weight_kg, reps,
         duration_seconds, distance_meters, intensity_type, intensity_value, is_extra, is_warmup,
         is_done, recorded_at)
      values (
        (v_set ->> 'id')::uuid, p_tenant, v_id, v_item_id, (v_set ->> 'set_number')::int, v_side,
        (v_set ->> 'weight_kg')::numeric, (v_set ->> 'reps')::int,
        (v_set ->> 'duration_seconds')::int, (v_set ->> 'distance_meters')::int,
        v_set ->> 'intensity_type', (v_set ->> 'intensity_value')::numeric,
        coalesce((v_set ->> 'is_extra')::boolean, false),
        v_is_warmup,
        coalesce((v_set ->> 'is_done')::boolean, true),
        (v_set ->> 'recorded_at')::timestamptz)
      -- La serie es (ejercicio, is_warmup, número, lado) (D-124, D-ideas-2).
      on conflict (workout_exercise_id, is_warmup, set_number, side) do update
      set weight_kg = excluded.weight_kg, reps = excluded.reps,
          duration_seconds = excluded.duration_seconds, distance_meters = excluded.distance_meters,
          intensity_type = excluded.intensity_type, intensity_value = excluded.intensity_value,
          is_extra = excluded.is_extra, is_done = excluded.is_done, recorded_at = excluded.recorded_at
      where ws.recorded_at < excluded.recorded_at;
      get diagnostics v_rows = row_count;
      v_changes := v_changes + v_rows;
    end loop;
  end loop;

  -- Corregir un entreno ya cerrado (D-124): hasta 7 días, y queda "Editado".
  if v_stored.closed_at is not null and v_changes > 0 then
    if v_stored.closed_at < now() - interval '7 days' then
      raise exception 'workout_locked';
    end if;
    update public.workouts set edited_at = now() where id = v_id;
  end if;
end;
$$;
