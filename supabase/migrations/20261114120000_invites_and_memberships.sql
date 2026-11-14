-- =====================================================================
-- Migración 3: invitaciones, bajas y negocio (Fase 1, PR 1.8)
--
--   1. Códigos de 8 caracteres sin los que se confunden (D-050).
--   2. Vista previa de un código sin sesión, con tope de intentos (D-051 y D-052).
--   3. Unirse con un resultado distinto para cada caso (D-054). Ya NO
--      reactiva a un cliente dado de baja (D-055).
--   4. Dar de baja y reactivar, solo el dueño, comprobando el plan (D-055).
--      Se retira el permiso de cambiar a mano la columna status.
--   5. my_spaces: los espacios del usuario; de los dados de baja, solo el
--      nombre del coach (D-055 y D-056).
--   6. create_tenant pide las condiciones para coaches, valida el nombre y
--      nace con la marca del negocio (D-049 y D-060).
--
-- Por qué preview_invite y join_tenant_with_code DEVUELVEN el resultado en vez
-- de lanzar un error: un error deshace toda la transacción, también el apunte
-- del intento fallido, y el tope de intentos nunca llegaría a contar.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. GENERADOR DE CÓDIGOS (D-050)
--    31 caracteres: letras y números sin 0, O, 1, I ni L. 8 posiciones:
--    unos 850.000 millones de combinaciones. Los bytes de 248 en adelante se
--    descartan para que todos los caracteres salgan con la misma probabilidad
--    (248 = 31 × 8).
-- ---------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql volatile set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_byte int;
begin
  while char_length(v_code) < 8 loop
    v_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if v_byte < 248 then
      v_code := v_code || substr(v_alphabet, (v_byte % 31) + 1, 1);
    end if;
  end loop;
  return v_code;
end;
$$;

-- Al escribirlo no importan las mayúsculas, los espacios ni los guiones (D-050).
create function private.normalize_invite_code(p_code text)
returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[[:space:]-]', '', 'g'));
$$;


-- ---------------------------------------------------------------------
-- 2. TOPE DE INTENTOS DE CÓDIGOS (D-052)
--    Tras 10 códigos equivocados en 10 minutos, 15 minutos de espera. Se
--    cuenta por usuario si hay sesión y por conexión si no la hay.
-- ---------------------------------------------------------------------

-- ¿Hubo, en los últimos p_lockout, un momento con p_max fallos en p_window?
create function private.is_locked_out(
  p_bucket text, p_key text, p_max int, p_window interval, p_lockout interval
) returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1
    from private.rate_limit_hits h
    where h.bucket = p_bucket and h.key = p_key and h.at > now() - p_lockout
      and (
        select count(*)
        from private.rate_limit_hits h2
        where h2.bucket = p_bucket and h2.key = p_key
          and h2.at between h.at - p_window and h.at
      ) >= p_max
  );
$$;

create function private.invite_attempt_key()
returns text
language sql stable set search_path = '' as $$
  select coalesce('user:' || auth.uid()::text, 'ip:' || private.request_ip());
$$;

create function private.invite_code_locked(p_key text)
returns boolean
language sql stable set search_path = '' as $$
  select private.is_locked_out('invite_code', p_key, 10, interval '10 minutes', interval '15 minutes');
$$;


-- ---------------------------------------------------------------------
-- 3. VISTA PREVIA DEL COACH (D-051): con sesión o sin ella.
--    Devuelve {status: 'ok', name, branding}, {status: 'invalid_code'} o
--    {status: 'rate_limited'}. Nada más: ni clientes ni otros datos.
--    Un código regenerado o de un negocio suspendido es 'invalid_code' (D-054).
-- ---------------------------------------------------------------------
create or replace function public.preview_invite(p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key    text := private.invite_attempt_key();
  v_result jsonb;
begin
  if private.invite_code_locked(v_key) then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select jsonb_build_object('status', 'ok', 'name', t.name, 'branding', t.branding)
  into v_result
  from public.tenant_invites i
  join public.tenants t on t.id = i.tenant_id
  where i.code = private.normalize_invite_code(p_code)
    and i.is_active
    and t.status in ('active', 'past_due');

  if v_result is null then
    perform private.record_hit('invite_code', v_key);
    return jsonb_build_object('status', 'invalid_code');
  end if;
  return v_result;
end;
$$;


-- ---------------------------------------------------------------------
-- 4. UNIRSE CON EL CÓDIGO (D-054)
--    Devuelve {status, tenant_id?}:
--      'joined'         alta nueva (tenant_id)
--      'already_member' ya era cliente activo (tenant_id)
--      'own_business'   es coach de ese negocio (tenant_id)
--      'archived'       su coach lo dio de baja: no vuelve a entrar solo (D-055)
--      'plan_full'      el plan del coach no tiene plazas
--      'invalid_code'   no existe, se regeneró o el negocio está suspendido
--      'rate_limited'   demasiados códigos equivocados (D-052)
-- ---------------------------------------------------------------------
drop function public.join_tenant_with_code(text);

create function public.join_tenant_with_code(p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_key    text;
  v_tenant uuid;
  v_role   text;
  v_status text;
  v_max    int;
  v_count  int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  v_key := 'user:' || v_user::text;

  if private.invite_code_locked(v_key) then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select i.tenant_id into v_tenant
  from public.tenant_invites i
  join public.tenants t on t.id = i.tenant_id
  where i.code = private.normalize_invite_code(p_code)
    and i.is_active
    and t.status in ('active', 'past_due');

  if v_tenant is null then
    perform private.record_hit('invite_code', v_key);
    return jsonb_build_object('status', 'invalid_code');
  end if;

  select m.role, m.status into v_role, v_status
  from public.tenant_members m
  where m.tenant_id = v_tenant and m.user_id = v_user;

  if found then
    if v_role <> 'client' then
      return jsonb_build_object('status', 'own_business', 'tenant_id', v_tenant);
    end if;
    if v_status = 'active' then
      return jsonb_build_object('status', 'already_member', 'tenant_id', v_tenant);
    end if;
    return jsonb_build_object('status', 'archived');
  end if;

  -- Bloquea el tenant para que dos altas a la vez no se salten el límite.
  perform 1 from public.tenants where id = v_tenant for update;

  select p.max_clients into v_max
  from public.tenants t
  join public.plans p on p.key = t.plan
  where t.id = v_tenant;

  select count(*) into v_count
  from public.tenant_members
  where tenant_id = v_tenant and role = 'client' and status = 'active';

  if v_max is not null and v_count >= v_max then
    return jsonb_build_object('status', 'plan_full');
  end if;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant, v_user, 'client');

  insert into public.audit_log (tenant_id, actor_id, action)
  values (v_tenant, v_user, 'member.joined');

  return jsonb_build_object('status', 'joined', 'tenant_id', v_tenant);
end;
$$;


-- ---------------------------------------------------------------------
-- 5. DAR DE BAJA Y REACTIVAR (D-055): solo el dueño, solo a clientes.
-- ---------------------------------------------------------------------
create function public.archive_client(p_tenant uuid, p_user uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;

  update public.tenant_members
  set status = 'archived'
  where tenant_id = p_tenant and user_id = p_user and role = 'client' and status = 'active';

  if not found then
    raise exception 'not_found';
  end if;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'member.archived', jsonb_build_object('user_id', p_user));
end;
$$;

create function public.reactivate_client(p_tenant uuid, p_user uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_status text;
  v_max    int;
  v_count  int;
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;

  -- Bloquea el tenant: reactivar y unirse a la vez no pueden saltarse el límite.
  perform 1 from public.tenants where id = p_tenant for update;

  select status into v_status
  from public.tenant_members
  where tenant_id = p_tenant and user_id = p_user and role = 'client';

  if not found then
    raise exception 'not_found';
  end if;
  if v_status = 'active' then
    return;
  end if;

  select p.max_clients into v_max
  from public.tenants t
  join public.plans p on p.key = t.plan
  where t.id = p_tenant;

  select count(*) into v_count
  from public.tenant_members
  where tenant_id = p_tenant and role = 'client' and status = 'active';

  if v_max is not null and v_count >= v_max then
    raise exception 'plan_limit_reached';
  end if;

  update public.tenant_members
  set status = 'active'
  where tenant_id = p_tenant and user_id = p_user;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'member.reactivated', jsonb_build_object('user_id', p_user));
end;
$$;

-- Dar de baja o reactivar ya solo se hace con las dos funciones de arriba, que
-- comprueban el plan y lo anotan. Nadie cambia la columna a mano.
drop policy members_update on public.tenant_members;
revoke update (status) on public.tenant_members from authenticated;


-- ---------------------------------------------------------------------
-- 6. LOS ESPACIOS DEL USUARIO (D-055 y D-056)
--    De un espacio dado de baja se devuelve solo el nombre del coach, para
--    poder decir "Ya no tienes acceso a …". La marca, solo de los activos.
-- ---------------------------------------------------------------------
create function public.my_spaces()
returns table (
  tenant_id   uuid,
  role        text,
  status      text,
  joined_at   timestamptz,
  tenant_name text,
  branding    jsonb
)
language sql stable security definer set search_path = '' as $$
  select
    m.tenant_id,
    m.role,
    m.status,
    m.created_at,
    t.name,
    case when m.status = 'active' then t.branding end
  from public.tenant_members m
  join public.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid()
  order by m.created_at;
$$;


-- ---------------------------------------------------------------------
-- 7. CREAR NEGOCIO (D-049 y D-060)
--    Pide la versión de las condiciones para coaches aceptadas y la anota en
--    audit_log. El nombre, de 2 a 40 caracteres (el mismo límite que la marca).
--    La marca nace con el nombre del negocio y los colores de ATHLETE CORE.
-- ---------------------------------------------------------------------
drop function public.create_tenant(text);

create function public.create_tenant(p_name text, p_coach_terms_version text)
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_name   text := trim(coalesce(p_name, ''));
  v_terms  text := trim(coalesce(p_coach_terms_version, ''));
  v_tenant uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(v_terms) not between 1 and 40 then
    raise exception 'terms_required';
  end if;
  if char_length(v_name) not between 2 and 40 then
    raise exception 'invalid_name';
  end if;

  -- v1: un usuario solo puede ser dueño de un negocio.
  if exists (
    select 1 from public.tenant_members
    where user_id = v_user and role = 'owner'
  ) then
    raise exception 'already_owner';
  end if;

  insert into public.tenants (name, branding)
  values (
    v_name,
    jsonb_build_object(
      'appName', v_name,
      'logoPath', null,
      'colors', jsonb_build_object('primary', '#2563EB', 'accent', '#FF7A1A'),
      'mode', 'dark'
    )
  )
  returning id into v_tenant;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant, v_user, 'owner');

  -- Si el código ya existiera (rarísimo), se prueba con otro.
  loop
    begin
      insert into public.tenant_invites (code, tenant_id, created_by)
      values (public.generate_invite_code(), v_tenant, v_user);
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (v_tenant, v_user, 'tenant.created', jsonb_build_object('coach_terms_version', v_terms));

  return v_tenant;
end;
$$;


-- ---------------------------------------------------------------------
-- 8. PERMISOS (las funciones nuevas nacen sin permisos, D-032)
-- ---------------------------------------------------------------------
grant execute on function public.preview_invite(text)              to anon, authenticated;
grant execute on function public.join_tenant_with_code(text)       to authenticated;
grant execute on function public.archive_client(uuid, uuid)        to authenticated;
grant execute on function public.reactivate_client(uuid, uuid)     to authenticated;
grant execute on function public.my_spaces()                       to authenticated;
grant execute on function public.create_tenant(text, text)         to authenticated;
