-- =====================================================================
-- Migración 16: gestionar la rutina de un cliente (Fase 2, PR 2.12b)
--
-- Lo que el coach hace con una rutina ya asignada (DECISIONES D-078,
-- D-081, D-083 y D-105): terminar la vigente, cancelar la próxima,
-- reiniciarla desde una fecha y un bloque, y guardarla como plantilla.
--
-- Como en la migración anterior, "hoy" lo dice el dispositivo del coach.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LA RUTINA DE UN CLIENTE, BLOQUEADA PARA CAMBIARLA
--    Comprueba que quien llama es coach del negocio y que la rutina es de
--    un cliente de ese negocio. No se concede a nadie: solo la usan las
--    funciones de abajo.
-- ---------------------------------------------------------------------
create function private.client_program_for_update(p_tenant uuid, p_program uuid)
returns public.programs
language plpgsql volatile set search_path = '' as $$
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
  if v_program.client_id is null then
    raise exception 'not_a_client_program';
  end if;
  return v_program;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. TERMINAR LA RUTINA VIGENTE (D-081)
--    Pasa a "Anteriores" y el cliente se queda sin rutina. No se borra.
--    También vale para un cliente dado de baja.
-- ---------------------------------------------------------------------
create function public.end_program(p_tenant uuid, p_program uuid, p_today date)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
begin
  v_program := private.client_program_for_update(p_tenant, p_program);
  -- Solo se usa la comprobación de "hoy": la fecha y el modo son los suyos.
  perform private.assert_program_start(p_today, v_program.mode, p_today);
  if v_program.ended_at is not null then
    raise exception 'program_already_ended';
  end if;
  -- Una que aún no ha empezado no se termina: se cancela.
  if v_program.starts_on > p_today then
    raise exception 'program_not_started';
  end if;

  update public.programs set ended_at = now() where id = p_program;
  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.ended',
          jsonb_build_object('program_id', p_program, 'user_id', v_program.client_id));
end;
$$;


-- ---------------------------------------------------------------------
-- 3. CANCELAR LA PRÓXIMA (D-081)
--    Nunca llegó a empezar: se borra (D-105).
-- ---------------------------------------------------------------------
create function public.cancel_next_program(p_tenant uuid, p_program uuid, p_today date)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
begin
  v_program := private.client_program_for_update(p_tenant, p_program);
  perform private.assert_program_start(p_today, v_program.mode, p_today);
  if v_program.ended_at is not null or v_program.starts_on <= p_today then
    raise exception 'program_already_started';
  end if;

  delete from public.programs where id = p_program;
  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.canceled',
          jsonb_build_object('program_id', p_program, 'user_id', v_program.client_id));
end;
$$;


-- ---------------------------------------------------------------------
-- 4. REINICIAR DESDE UNA FECHA Y DESDE UN BLOQUE (D-083)
--    Tras una baja, unas vacaciones o una lesión. Sin bloque = el primero.
--    Al cliente dado de baja no se le reinicia nada. Una rutina terminada
--    no se reinicia: se asigna otra.
--    Las demás rutinas del cliente siguen las reglas de asignar (D-081):
--    con fecha de hoy o pasada, las ya empezadas quedan terminadas; con
--    fecha futura, sustituye a la próxima que hubiera.
-- ---------------------------------------------------------------------
create function public.restart_program(
  p_tenant    uuid,
  p_program   uuid,
  p_starts_on date,
  p_block     uuid,
  p_today     date
)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
begin
  v_program := private.client_program_for_update(p_tenant, p_program);
  perform private.assert_program_start(p_starts_on, v_program.mode, p_today);
  if v_program.ended_at is not null then
    raise exception 'program_already_ended';
  end if;
  if p_block is not null and not exists (
    select 1 from public.program_blocks where id = p_block and program_id = p_program
  ) then
    raise exception 'invalid_reference';
  end if;

  -- Se aparta de la cuenta mientras se hace sitio, para que no se termine
  -- ni se borre a sí misma.
  update public.programs set ended_at = now() where id = p_program;
  perform private.make_room_for_program(p_tenant, v_program.client_id, p_starts_on, p_today);
  update public.programs
  set ended_at = null, starts_on = p_starts_on, start_block_id = p_block
  where id = p_program;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.restarted',
          jsonb_build_object('program_id', p_program, 'user_id', v_program.client_id));
end;
$$;


-- ---------------------------------------------------------------------
-- 5. GUARDAR LA RUTINA DE UN CLIENTE COMO PLANTILLA NUEVA (D-078)
--    Una copia completa, sin cliente ni fechas. Cuenta para el tope de
--    plantillas (D-086). Devuelve el identificador de la plantilla.
-- ---------------------------------------------------------------------
create function public.save_program_as_template(p_tenant uuid, p_program uuid, p_name text)
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program  public.programs;
  v_name     text := btrim(coalesce(p_name, ''));
  v_template uuid;
begin
  v_program := private.client_program_for_update(p_tenant, p_program);
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_name';
  end if;
  perform private.assert_template_room(p_tenant);

  v_template := private.copy_program(p_tenant, p_program, v_name, null, null, 'calendar', auth.uid());
  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.saved_as_template',
          jsonb_build_object('program_id', p_program, 'template_id', v_template));
  return v_template;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. PERMISOS (las funciones nuevas nacen sin permisos, D-032)
-- ---------------------------------------------------------------------
grant execute on function public.end_program(uuid, uuid, date)                     to authenticated;
grant execute on function public.cancel_next_program(uuid, uuid, date)             to authenticated;
grant execute on function public.restart_program(uuid, uuid, date, uuid, date)     to authenticated;
grant execute on function public.save_program_as_template(uuid, uuid, text)        to authenticated;
