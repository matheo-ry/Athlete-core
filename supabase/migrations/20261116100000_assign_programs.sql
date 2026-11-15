-- =====================================================================
-- Migración 15: asignar una rutina a un cliente (Fase 2, PR 2.12a)
--
-- Las funciones con las que una rutina llega a un cliente (DECISIONES
-- D-078, D-081 a D-083 y D-105): asignar una plantilla a uno o a varios
-- clientes, y crear una rutina vacía para uno. Cada cliente recibe su
-- copia completa: cambiarla no toca la plantilla.
--
-- Terminar, cancelar, reiniciar y guardar como plantilla llegan en la
-- migración siguiente (PR 2.12b).
--
-- "Hoy" es la fecha del dispositivo del coach (D-082), no la del
-- servidor: por eso las funciones la reciben. Solo se acepta si está a un
-- día, como mucho, de la fecha del servidor (las zonas horarias no dan
-- para más), para que nadie la use para saltarse las reglas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COPIAR UNA RUTINA ENTERA
--    Crea una rutina nueva con los mismos bloques, días, ejercicios y
--    series que otra. No comprueba permisos: solo la llaman las funciones
--    de abajo (y el seed), que ya los han comprobado.
--    Un ejercicio archivado se copia igual: en la rutina de origen se
--    conserva donde ya estaba (D-073), y la copia es esa misma rutina.
-- ---------------------------------------------------------------------
create function private.copy_program(
  p_tenant    uuid,
  p_source    uuid,
  p_name      text,
  p_client    uuid,
  p_starts_on date,
  p_mode      text,
  p_actor     uuid
)
returns uuid
language plpgsql volatile set search_path = '' as $$
declare
  v_id     uuid;
  v_block  public.program_blocks;
  v_day    public.program_days;
  v_item   public.program_day_exercises;
  v_block_id uuid;
  v_day_id   uuid;
  v_item_id  uuid;
begin
  insert into public.programs
    (tenant_id, name, client_id, source_program_id, starts_on, mode, created_by)
  values (p_tenant, p_name, p_client, p_source, p_starts_on, p_mode, p_actor)
  returning id into v_id;

  for v_block in
    select * from public.program_blocks
    where program_id = p_source and tenant_id = p_tenant order by position
  loop
    insert into public.program_blocks (tenant_id, program_id, position, name, cycle_days, laps)
    values (p_tenant, v_id, v_block.position, v_block.name, v_block.cycle_days, v_block.laps)
    returning id into v_block_id;

    for v_day in
      select * from public.program_days
      where block_id = v_block.id and program_id = p_source order by day_number
    loop
      insert into public.program_days
        (tenant_id, program_id, block_id, day_number, kind, name, subtitle, place)
      values (p_tenant, v_id, v_block_id, v_day.day_number, v_day.kind, v_day.name,
              v_day.subtitle, v_day.place)
      returning id into v_day_id;

      for v_item in
        select * from public.program_day_exercises
        where day_id = v_day.id and program_id = p_source order by position
      loop
        insert into public.program_day_exercises
          (tenant_id, program_id, day_id, position, exercise_id, superset_group, rest_seconds, note)
        values (p_tenant, v_id, v_day_id, v_item.position, v_item.exercise_id,
                v_item.superset_group, v_item.rest_seconds, v_item.note)
        returning id into v_item_id;

        insert into public.program_sets
          (tenant_id, program_id, day_exercise_id, position, reps_min, reps_max, duration_seconds,
           distance_meters, intensity_type, intensity_value, target_load_kg)
        select p_tenant, v_id, v_item_id, s.position, s.reps_min, s.reps_max, s.duration_seconds,
               s.distance_meters, s.intensity_type, s.intensity_value, s.target_load_kg
        from public.program_sets s
        where s.day_exercise_id = v_item.id and s.program_id = p_source;
      end loop;
    end loop;
  end loop;

  return v_id;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. HACER SITIO A LA RUTINA NUEVA DE UN CLIENTE (D-081)
--    Comprueba al cliente y aplica las reglas antes de crear su rutina:
--    - Solo clientes activos de este negocio (D-083: a uno dado de baja no
--      se le asigna nada). El mismo error si es de otro negocio: no se
--      desvela si existe.
--    - Con fecha de hoy o pasada, sus rutinas ya empezadas quedan
--      terminadas: pasan a "Anteriores". No se borran.
--    - Con fecha futura, sustituye a la próxima que hubiera. Esa se borra:
--      nunca llegó a empezar, así que no tiene historia que guardar (D-105).
-- ---------------------------------------------------------------------
create function private.make_room_for_program(
  p_tenant    uuid,
  p_client    uuid,
  p_starts_on date,
  p_today     date
)
returns void
language plpgsql volatile set search_path = '' as $$
begin
  -- Bloquea la fila del cliente: dos asignaciones a la vez no dejan dos
  -- rutinas vigentes.
  perform 1 from public.tenant_members
  where tenant_id = p_tenant and user_id = p_client and role = 'client' and status = 'active'
  for update;
  if not found then
    raise exception 'client_not_found';
  end if;

  if p_starts_on <= p_today then
    update public.programs set ended_at = now()
    where tenant_id = p_tenant and client_id = p_client
      and ended_at is null and starts_on <= p_today;
  else
    delete from public.programs
    where tenant_id = p_tenant and client_id = p_client
      and ended_at is null and starts_on > p_today;
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 3. COMPROBAR LA FECHA DE INICIO, EL MODO Y "HOY"
-- ---------------------------------------------------------------------
create function private.assert_program_start(p_starts_on date, p_mode text, p_today date)
returns void
language plpgsql stable set search_path = '' as $$
declare
  v_server date := (now() at time zone 'utc')::date;
begin
  if p_today is null or p_today not between v_server - 1 and v_server + 1 then
    raise exception 'invalid_today';
  end if;
  -- Un año hacia atrás o hacia delante: más lejos es un error al escribir.
  if p_starts_on is null or p_starts_on not between p_today - 366 and p_today + 366 then
    raise exception 'invalid_start';
  end if;
  if p_mode is null or p_mode not in ('calendar', 'list') then
    raise exception 'invalid_mode';
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 4. ASIGNAR UNA PLANTILLA A UNO O A VARIOS CLIENTES
--    O todos o ninguno: si un cliente no vale, no se asigna a nadie.
--    Devuelve [ { client_id, program_id } ].
-- ---------------------------------------------------------------------
create function public.assign_program(
  p_tenant    uuid,
  p_template  uuid,
  p_clients   uuid[],
  p_starts_on date,
  p_mode      text,
  p_today     date
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_template public.programs;
  v_clients  uuid[];
  v_client   uuid;
  v_program  uuid;
  v_result   jsonb := '[]'::jsonb;
begin
  if not public.is_member(p_tenant, array['owner','staff']) then
    raise exception 'not_allowed';
  end if;
  perform private.assert_program_start(p_starts_on, p_mode, p_today);

  -- Caso 17: la plantilla tiene que ser de este negocio.
  select * into v_template from public.programs
  where id = p_template and tenant_id = p_tenant;
  if not found then
    raise exception 'program_not_found';
  end if;
  if v_template.client_id is not null then
    raise exception 'not_a_template';
  end if;
  if v_template.archived_at is not null then
    raise exception 'template_archived';
  end if;

  -- Sin repetidos y siempre en el mismo orden, para que dos asignaciones a
  -- la vez no se bloqueen entre sí.
  select coalesce(array_agg(distinct c order by c), '{}') into v_clients
  from unnest(p_clients) c where c is not null;
  if cardinality(v_clients) = 0 or cardinality(v_clients) > 100 then
    raise exception 'invalid_clients';
  end if;

  foreach v_client in array v_clients loop
    perform private.make_room_for_program(p_tenant, v_client, p_starts_on, p_today);
    v_program := private.copy_program(
      p_tenant, p_template, v_template.name, v_client, p_starts_on, p_mode, auth.uid());
    -- Sin datos personales: solo identificadores.
    insert into public.audit_log (tenant_id, actor_id, action, meta)
    values (p_tenant, auth.uid(), 'program.assigned',
            jsonb_build_object('program_id', v_program, 'template_id', p_template,
                               'user_id', v_client));
    v_result := v_result
      || jsonb_build_object('client_id', v_client, 'program_id', v_program);
  end loop;

  return v_result;
end;
$$;


-- ---------------------------------------------------------------------
-- 5. CREAR UNA RUTINA VACÍA PARA UN CLIENTE, SIN PLANTILLA (D-078)
--    Como una plantilla nueva: un bloque sin fecha de fin con todos sus
--    días de descanso. El coach la rellena en el editor.
-- ---------------------------------------------------------------------
create function public.create_client_program(
  p_tenant     uuid,
  p_client     uuid,
  p_name       text,
  p_cycle_days int,
  p_starts_on  date,
  p_mode       text,
  p_today      date
)
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_program uuid;
  v_block   uuid;
begin
  if not public.is_member(p_tenant, array['owner','staff']) then
    raise exception 'not_allowed';
  end if;
  perform private.assert_program_start(p_starts_on, p_mode, p_today);
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_name';
  end if;
  if p_cycle_days is null or p_cycle_days not between 1 and 28 then
    raise exception 'invalid_cycle';
  end if;

  perform private.make_room_for_program(p_tenant, p_client, p_starts_on, p_today);

  insert into public.programs (tenant_id, name, client_id, starts_on, mode, created_by)
  values (p_tenant, v_name, p_client, p_starts_on, p_mode, auth.uid())
  returning id into v_program;
  insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
  values (p_tenant, v_program, 1, p_cycle_days)
  returning id into v_block;
  insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
  select p_tenant, v_program, v_block, n, 'rest' from generate_series(1, p_cycle_days) n;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.created_for_client',
          jsonb_build_object('program_id', v_program, 'user_id', p_client));

  return v_program;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. PERMISOS (las funciones nuevas nacen sin permisos, D-032)
--    Las funciones de "private" no se conceden a nadie.
-- ---------------------------------------------------------------------
grant execute on function public.assign_program(uuid, uuid, uuid[], date, text, date)
  to authenticated;
grant execute on function public.create_client_program(uuid, uuid, text, int, date, text, date)
  to authenticated;
