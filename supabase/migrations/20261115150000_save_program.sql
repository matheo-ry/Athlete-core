-- =====================================================================
-- Migración 13: guardar una rutina de una vez (Fase 2, PR 2.6)
--
-- El editor guarda la rutina entera con save_program: o todo o nada
-- (DECISIONES D-079). Es la única puerta de escritura de las cinco tablas
-- de rutinas, así que aquí viven las reglas que cruzan filas y los topes
-- de D-086. Cada regla que no se cumple es un error con su nombre; al
-- saltar, no se guarda nada.
--
-- Además: archivar y recuperar una plantilla.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL TOPE DE PLANTILLAS (D-086): 300 sin archivar por negocio
--    Se comprueba al crear una y al recuperar una archivada.
-- ---------------------------------------------------------------------
create function private.assert_template_room(p_tenant uuid)
returns void
language plpgsql volatile set search_path = '' as $$
begin
  -- Bloquea el negocio para que dos altas a la vez no se salten el tope.
  perform 1 from public.tenants where id = p_tenant for update;
  if (select count(*) from public.programs
      where tenant_id = p_tenant and client_id is null and archived_at is null) >= 300 then
    raise exception 'template_limit_reached';
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. GUARDAR UNA RUTINA
--    Recibe la rutina completa:
--      { id, expected_updated_at, name,
--        blocks: [ { id, name, cycle_days, laps,
--          days: [ { id, day_number, kind, name, subtitle, place,
--            exercises: [ { id, exercise_id, superset_group, rest_seconds, note,
--              sets: [ { id, reps_min, reps_max, duration_seconds, distance_meters,
--                        intensity_type, intensity_value, target_load_kg } ] } ] } ] } ] }
--    Sin "id" en la rutina, crea una plantilla. Con "id", la actualiza, sea
--    plantilla o rutina de un cliente (el cliente no cambia).
--    Lo que trae "id" se actualiza y conserva su identificador, que la
--    Fase 3 necesita (D-087); lo que no lo trae se crea; lo que ya no viene
--    se borra. El orden de bloques, ejercicios y series es el de la lista.
--    Devuelve { id, updated_at }.
-- ---------------------------------------------------------------------
create function public.save_program(p_tenant uuid, p_program jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id           uuid  := nullif(p_program ->> 'id', '')::uuid;
  v_name         text  := btrim(coalesce(p_program ->> 'name', ''));
  v_blocks       jsonb := coalesce(p_program -> 'blocks', '[]'::jsonb);
  v_block_count  int;
  v_updated_at   timestamptz;
  -- Los ejercicios que la rutina ya tenía: un archivado solo vale si está aquí.
  v_previous     uuid[] := '{}';
  v_kept_blocks  uuid[] := '{}';
  v_kept_days    uuid[] := '{}';
  v_kept_items   uuid[] := '{}';
  v_kept_sets    uuid[] := '{}';
  v_block  jsonb;  v_block_pos int;  v_block_id uuid;
  v_day    jsonb;  v_day_id uuid;
  v_item   jsonb;  v_item_pos int;   v_item_id uuid;
  v_set    jsonb;  v_set_pos int;    v_set_id uuid;
  v_days   jsonb;  v_items jsonb;    v_sets jsonb;
  v_cycle  int;    v_laps int;
  v_exercise public.exercises;
begin
  if not public.is_member(p_tenant, array['owner','staff']) then
    raise exception 'not_allowed';
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_name';
  end if;
  if jsonb_typeof(v_blocks) <> 'array' or jsonb_array_length(v_blocks) = 0 then
    raise exception 'program_needs_block';
  end if;
  v_block_count := jsonb_array_length(v_blocks);
  if v_block_count > 12 then
    raise exception 'too_many_blocks';
  end if;

  if v_id is null then
    perform private.assert_template_room(p_tenant);
    insert into public.programs (tenant_id, name, created_by)
    values (p_tenant, v_name, auth.uid())
    returning id into v_id;
  else
    select updated_at into v_updated_at
    from public.programs where id = v_id and tenant_id = p_tenant for update;
    if not found then
      raise exception 'program_not_found';
    end if;
    -- Guardado desde otro dispositivo (D-079): si cambió desde que se cargó,
    -- no se pisa.
    if v_updated_at is distinct from (p_program ->> 'expected_updated_at')::timestamptz then
      raise exception 'program_conflict';
    end if;
    select coalesce(array_agg(distinct exercise_id), '{}') into v_previous
    from public.program_day_exercises where program_id = v_id;
    -- Aunque el nombre no cambie: el trigger pone updated_at al día.
    update public.programs set name = v_name where id = v_id;
  end if;

  for v_block, v_block_pos in
    select value, ordinality from jsonb_array_elements(v_blocks) with ordinality
  loop
    v_cycle := (v_block ->> 'cycle_days')::int;
    v_laps  := (v_block ->> 'laps')::int;
    v_days  := coalesce(v_block -> 'days', '[]'::jsonb);
    if v_cycle is null or v_cycle not between 1 and 28 then
      raise exception 'invalid_cycle';
    end if;
    -- Solo el último bloque puede no tener fecha de fin (D-075).
    if (v_laps is null and v_block_pos < v_block_count) or v_laps not between 1 and 52 then
      raise exception 'invalid_laps';
    end if;
    -- Una fila por cada día del ciclo, ni más ni menos.
    if jsonb_typeof(v_days) <> 'array'
       or (select array_agg((d ->> 'day_number')::int order by 1) from jsonb_array_elements(v_days) d)
          is distinct from (select array_agg(n) from generate_series(1, v_cycle) n) then
      raise exception 'invalid_days';
    end if;

    v_block_id := nullif(v_block ->> 'id', '')::uuid;
    if v_block_id is null then
      insert into public.program_blocks (tenant_id, program_id, position, name, cycle_days, laps)
      values (p_tenant, v_id, v_block_pos, nullif(btrim(v_block ->> 'name'), ''), v_cycle, v_laps)
      returning id into v_block_id;
    else
      update public.program_blocks
      set position = v_block_pos, name = nullif(btrim(v_block ->> 'name'), ''),
          cycle_days = v_cycle, laps = v_laps
      where id = v_block_id and program_id = v_id;
      if not found then
        raise exception 'invalid_reference';
      end if;
    end if;
    v_kept_blocks := v_kept_blocks || v_block_id;

    for v_day in select value from jsonb_array_elements(v_days) loop
      v_items := coalesce(v_day -> 'exercises', '[]'::jsonb);
      if jsonb_typeof(v_items) <> 'array' then
        raise exception 'invalid_days';
      end if;
      if v_day ->> 'kind' = 'rest' and jsonb_array_length(v_items) > 0 then
        raise exception 'rest_day_with_exercises';
      end if;
      if jsonb_array_length(v_items) > 30 then
        raise exception 'too_many_exercises';
      end if;

      v_day_id := nullif(v_day ->> 'id', '')::uuid;
      if v_day_id is null then
        insert into public.program_days
          (tenant_id, program_id, block_id, day_number, kind, name, subtitle, place)
        values (p_tenant, v_id, v_block_id, (v_day ->> 'day_number')::int, v_day ->> 'kind',
                nullif(btrim(v_day ->> 'name'), ''), nullif(btrim(v_day ->> 'subtitle'), ''),
                nullif(btrim(v_day ->> 'place'), ''))
        returning id into v_day_id;
      else
        update public.program_days
        set block_id = v_block_id, day_number = (v_day ->> 'day_number')::int, kind = v_day ->> 'kind',
            name = nullif(btrim(v_day ->> 'name'), ''), subtitle = nullif(btrim(v_day ->> 'subtitle'), ''),
            place = nullif(btrim(v_day ->> 'place'), '')
        where id = v_day_id and program_id = v_id;
        if not found then
          raise exception 'invalid_reference';
        end if;
      end if;
      v_kept_days := v_kept_days || v_day_id;

      for v_item, v_item_pos in
        select value, ordinality from jsonb_array_elements(v_items) with ordinality
      loop
        v_sets := coalesce(v_item -> 'sets', '[]'::jsonb);
        -- Series obligatorias: de 1 a 10 (D-076).
        if jsonb_typeof(v_sets) <> 'array' or jsonb_array_length(v_sets) = 0 then
          raise exception 'exercise_needs_sets';
        end if;
        if jsonb_array_length(v_sets) > 10 then
          raise exception 'too_many_sets';
        end if;
        select * into v_exercise from public.exercises
        where id = (v_item ->> 'exercise_id')::uuid and tenant_id = p_tenant;
        if not found then
          raise exception 'exercise_not_found';
        end if;
        -- Un archivado se conserva donde ya estaba, pero no se añade (D-073).
        if v_exercise.archived_at is not null and not (v_exercise.id = any (v_previous)) then
          raise exception 'exercise_archived';
        end if;

        v_item_id := nullif(v_item ->> 'id', '')::uuid;
        if v_item_id is null then
          insert into public.program_day_exercises
            (tenant_id, program_id, day_id, position, exercise_id, superset_group, rest_seconds, note)
          values (p_tenant, v_id, v_day_id, v_item_pos, v_exercise.id,
                  (v_item ->> 'superset_group')::int, (v_item ->> 'rest_seconds')::int,
                  nullif(btrim(v_item ->> 'note'), ''))
          returning id into v_item_id;
        else
          update public.program_day_exercises
          set day_id = v_day_id, position = v_item_pos, exercise_id = v_exercise.id,
              superset_group = (v_item ->> 'superset_group')::int,
              rest_seconds = (v_item ->> 'rest_seconds')::int,
              note = nullif(btrim(v_item ->> 'note'), '')
          where id = v_item_id and program_id = v_id;
          if not found then
            raise exception 'invalid_reference';
          end if;
        end if;
        v_kept_items := v_kept_items || v_item_id;

        for v_set, v_set_pos in
          select value, ordinality from jsonb_array_elements(v_sets) with ordinality
        loop
          -- Lo prescrito tiene que casar con la forma de medir (D-072).
          if (v_exercise.measurement in ('weight_reps','bodyweight_reps')
                and num_nonnulls(v_set ->> 'duration_seconds', v_set ->> 'distance_meters') > 0)
             or (v_exercise.measurement = 'time'
                and num_nonnulls(v_set ->> 'reps_min', v_set ->> 'reps_max', v_set ->> 'distance_meters') > 0)
             or (v_exercise.measurement = 'distance'
                and num_nonnulls(v_set ->> 'reps_min', v_set ->> 'reps_max', v_set ->> 'duration_seconds') > 0)
          then
            raise exception 'invalid_set_target';
          end if;

          v_set_id := nullif(v_set ->> 'id', '')::uuid;
          if v_set_id is null then
            insert into public.program_sets
              (tenant_id, program_id, day_exercise_id, position, reps_min, reps_max, duration_seconds,
               distance_meters, intensity_type, intensity_value, target_load_kg)
            values (p_tenant, v_id, v_item_id, v_set_pos,
                    (v_set ->> 'reps_min')::int, (v_set ->> 'reps_max')::int,
                    (v_set ->> 'duration_seconds')::int, (v_set ->> 'distance_meters')::int,
                    v_set ->> 'intensity_type', (v_set ->> 'intensity_value')::numeric,
                    (v_set ->> 'target_load_kg')::numeric)
            returning id into v_set_id;
          else
            update public.program_sets
            set day_exercise_id = v_item_id, position = v_set_pos,
                reps_min = (v_set ->> 'reps_min')::int, reps_max = (v_set ->> 'reps_max')::int,
                duration_seconds = (v_set ->> 'duration_seconds')::int,
                distance_meters = (v_set ->> 'distance_meters')::int,
                intensity_type = v_set ->> 'intensity_type',
                intensity_value = (v_set ->> 'intensity_value')::numeric,
                target_load_kg = (v_set ->> 'target_load_kg')::numeric
            where id = v_set_id and program_id = v_id;
            if not found then
              raise exception 'invalid_reference';
            end if;
          end if;
          v_kept_sets := v_kept_sets || v_set_id;
        end loop;
      end loop;
    end loop;
  end loop;

  -- Lo que ya no viene, se borra. De abajo arriba: lo que se movió de sitio
  -- ya cuelga de su nuevo padre y no se va con el antiguo.
  delete from public.program_sets          where program_id = v_id and id <> all (v_kept_sets);
  delete from public.program_day_exercises where program_id = v_id and id <> all (v_kept_items);
  delete from public.program_days          where program_id = v_id and id <> all (v_kept_days);
  delete from public.program_blocks        where program_id = v_id and id <> all (v_kept_blocks);

  return (select jsonb_build_object('id', id, 'updated_at', updated_at)
          from public.programs where id = v_id);
end;
$$;


-- ---------------------------------------------------------------------
-- 3. ARCHIVAR Y RECUPERAR UNA PLANTILLA
--    Las rutinas de un cliente no se archivan: se terminan (PR 2.12).
-- ---------------------------------------------------------------------
create function public.set_program_archived(p_tenant uuid, p_program uuid, p_archived boolean)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
begin
  if not public.is_member(p_tenant, array['owner','staff']) then
    raise exception 'not_allowed';
  end if;
  select * into v_program from public.programs
  where id = p_program and tenant_id = p_tenant for update;
  if not found then
    raise exception 'program_not_found';
  end if;
  if v_program.client_id is not null then
    raise exception 'not_a_template';
  end if;
  if p_archived and v_program.archived_at is null then
    update public.programs set archived_at = now() where id = p_program;
  elsif not p_archived and v_program.archived_at is not null then
    perform private.assert_template_room(p_tenant);
    update public.programs set archived_at = null where id = p_program;
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 4. PERMISOS (las funciones nuevas nacen sin permisos, D-032)
-- ---------------------------------------------------------------------
grant execute on function public.save_program(uuid, jsonb)                 to authenticated;
grant execute on function public.set_program_archived(uuid, uuid, boolean) to authenticated;
