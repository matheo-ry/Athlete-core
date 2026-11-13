-- =====================================================================
-- Migración 1: esquema base (Fase 1, PR 1.1)
--
-- Sale de docs/referencia/esquema-base.sql, sin cambios en tablas,
-- políticas ni funciones. Diferencias con la referencia, todas en el
-- apartado 9 (permisos):
--   * Se activa el bloque OPCIONAL de privilegios por defecto: las tablas
--     y funciones que se creen en el futuro nacen SIN permisos, así que
--     olvidarse de un "grant" deja la tabla cerrada, no abierta
--     (DECISIONES D-032; lo demuestra supabase/tests/02_default_privileges.test.sql).
--   * También se quitan los permisos sobre secuencias, que Supabase
--     concede por defecto igual que los de las tablas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PLANES (catálogo de la plataforma; valores provisionales)
-- ---------------------------------------------------------------------
create table public.plans (
  key          text primary key,
  name         text not null,
  max_clients  int,                     -- null = sin límite
  sort_order   int  not null default 0
);

insert into public.plans (key, name, max_clients, sort_order) values
  ('free',    'Free',     3,   0),
  ('starter', 'Starter', 10,   1),
  ('pro',     'Pro',     30,   2),
  ('studio',  'Studio',  null, 3);


-- ---------------------------------------------------------------------
-- 2. TENANTS: el negocio de cada coach
-- ---------------------------------------------------------------------
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 60),
  plan            text not null default 'free' references public.plans(key),
  status          text not null default 'active'
                  check (status in ('active','past_due','suspended','canceled')),
  branding        jsonb not null default '{}'::jsonb,  -- {appName, logoPath, colors, mode}
  settings        jsonb not null default '{}'::jsonb,
  config_version  int  not null default 1,             -- para migrar JSON antiguos
  created_at      timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. PROFILES: datos del usuario (no pertenecen a ningún tenant)
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '' check (char_length(display_name) <= 80),
  locale        text not null default 'en' check (locale in ('en','es')),
  weight_unit   text not null default 'kg' check (weight_unit in ('kg','lb')),
  created_at    timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 4. MIEMBROS: qué usuario está en qué tenant y con qué rol
-- ---------------------------------------------------------------------
create table public.tenant_members (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner','staff','client')),
  status      text not null default 'active' check (status in ('active','archived')),
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members (user_id);

-- ¿El usuario actual es miembro ACTIVO del tenant con alguno de estos roles?
-- SECURITY DEFINER: evita que las políticas de tenant_members se llamen a sí mismas.
create or replace function public.is_member(
  p_tenant uuid,
  p_roles  text[] default array['owner','staff','client']
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.tenant_members m
    where m.tenant_id = p_tenant
      and m.user_id   = auth.uid()
      and m.status    = 'active'
      and m.role      = any (p_roles)
  );
$$;


-- ---------------------------------------------------------------------
-- 5. CÓDIGO PARA UNIRSE A UN COACH
-- ---------------------------------------------------------------------
create table public.tenant_invites (
  code        text primary key check (code ~ '^[A-Z0-9]{6,10}$'),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index tenant_invites_tenant_idx on public.tenant_invites (tenant_id);

create or replace function public.generate_invite_code()
returns text
language sql volatile set search_path = '' as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;


-- ---------------------------------------------------------------------
-- 6. FEATURE FLAGS
--    core        -> parte del producto: activo para todos
--    addon       -> se vende aparte: activo si lo incluye el plan o lo tiene el tenant
--    release     -> temporal: apagado salvo donde se esté probando;
--                   OBLIGATORIO sunset_at (fecha para borrarlo del código)
--    kill_switch -> activo para todos; existe para poder apagarlo sin desplegar
--    Cualquier flag se apaga para TODOS poniendo is_enabled = false.
-- ---------------------------------------------------------------------
create table public.features (
  key            text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  kind           text not null check (kind in ('core','addon','release','kill_switch')),
  is_enabled     boolean not null default true,   -- interruptor general
  description    text,
  config_schema  jsonb,
  sunset_at      date,
  check (kind <> 'release' or sunset_at is not null)
);

create table public.plan_features (
  plan         text not null references public.plans(key) on delete cascade,
  feature_key  text not null references public.features(key) on delete cascade,
  primary key (plan, feature_key)
);

-- Excepciones por tenant (compra de un addon, prueba temporal…)
create table public.tenant_features (
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  feature_key  text not null references public.features(key) on delete cascade,
  enabled      boolean not null,
  config       jsonb not null default '{}'::jsonb,
  source       text not null default 'manual' check (source in ('manual','purchase','trial')),
  expires_at   timestamptz,
  primary key (tenant_id, feature_key)
);

-- Resultado final para cada tenant. Un flag está activo si:
--   1) su interruptor general está encendido, Y
--   2) el tenant tiene una excepción vigente que lo decide, o si no la tiene:
--      es de tipo core o kill_switch, o lo incluye su plan.
-- security_invoker = true: la vista respeta el RLS de las tablas.
create view public.tenant_effective_features
with (security_invoker = true) as
select
  t.id  as tenant_id,
  f.key as feature_key,
  f.is_enabled
    and coalesce(
          tf.enabled,
          f.kind in ('core','kill_switch') or pf.feature_key is not null
        )                                          as enabled,
  coalesce(tf.config, '{}'::jsonb)                 as config
from public.tenants t
cross join public.features f
left join public.plan_features pf
       on pf.plan = t.plan and pf.feature_key = f.key
left join public.tenant_features tf
       on tf.tenant_id = t.id and tf.feature_key = f.key
      and (tf.expires_at is null or tf.expires_at > now());


-- ---------------------------------------------------------------------
-- 7. REGISTRO DE ACCIONES
-- ---------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  actor_id   uuid,
  action     text not null,            -- 'tenant.created', 'member.joined'…
  meta       jsonb not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
create index audit_log_tenant_idx on public.audit_log (tenant_id, at desc);


-- ---------------------------------------------------------------------
-- 7 bis. UTILIDAD: mantener al día la columna updated_at
--        Se engancha a cada tabla que tenga updated_at (ver la plantilla).
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 8. FUNCIONES PARA LAS OPERACIONES DELICADAS
-- ---------------------------------------------------------------------

-- 8.1 Crear el negocio de un coach. Devuelve el id del tenant.
create or replace function public.create_tenant(p_name text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_tenant uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  -- v1: un usuario solo puede ser dueño de un negocio.
  if exists (
    select 1 from public.tenant_members
    where user_id = v_user and role = 'owner'
  ) then
    raise exception 'already_owner';
  end if;

  insert into public.tenants (name) values (trim(p_name))
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

  insert into public.audit_log (tenant_id, actor_id, action)
  values (v_tenant, v_user, 'tenant.created');

  return v_tenant;
end;
$$;

-- 8.2 Ver a qué coach pertenece un código ANTES de unirse (nombre y marca).
create or replace function public.preview_invite(p_code text)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', t.name, 'branding', t.branding)
  from public.tenant_invites i
  join public.tenants t on t.id = i.tenant_id
  where i.code = upper(trim(p_code))
    and i.is_active
    and t.status in ('active','past_due');
$$;

-- 8.3 Unirse como cliente con el código del coach. Devuelve el id del tenant.
create or replace function public.join_tenant_with_code(p_code text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_tenant uuid;
  v_max    int;
  v_count  int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select i.tenant_id into v_tenant
  from public.tenant_invites i
  join public.tenants t on t.id = i.tenant_id
  where i.code = upper(trim(p_code))
    and i.is_active
    and t.status in ('active','past_due');

  if v_tenant is null then
    raise exception 'invalid_code';
  end if;

  -- Si ya es miembro activo, no hay nada que hacer.
  if exists (
    select 1 from public.tenant_members
    where tenant_id = v_tenant and user_id = v_user and status = 'active'
  ) then
    return v_tenant;
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
    raise exception 'plan_limit_reached';
  end if;

  -- Alta nueva, o reactivación de un cliente que estaba archivado.
  insert into public.tenant_members as m (tenant_id, user_id, role)
  values (v_tenant, v_user, 'client')
  on conflict (tenant_id, user_id) do update
    set status = 'active'
    where m.role = 'client';

  insert into public.audit_log (tenant_id, actor_id, action)
  values (v_tenant, v_user, 'member.joined');

  return v_tenant;
end;
$$;

-- 8.4 Cambiar el código de invitación (solo el dueño). Devuelve el código nuevo.
create or replace function public.regenerate_invite_code(p_tenant uuid)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;

  update public.tenant_invites set is_active = false
  where tenant_id = p_tenant and is_active;

  loop
    begin
      v_code := public.generate_invite_code();
      insert into public.tenant_invites (code, tenant_id, created_by)
      values (v_code, p_tenant, auth.uid());
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  insert into public.audit_log (tenant_id, actor_id, action)
  values (p_tenant, auth.uid(), 'invite.regenerated');

  return v_code;
end;
$$;


-- ---------------------------------------------------------------------
-- 9. PERMISOS: primero se quita todo, luego se concede lo justo
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- Lo que se cree a partir de ahora nace sin permisos (D-032).
-- Afecta a los objetos que crea el rol que aplica las migraciones (postgres).
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges revoke execute on functions from public;

-- Lectura
grant select on public.plans, public.features, public.plan_features to authenticated;
grant select on public.tenants, public.profiles, public.tenant_members,
                public.tenant_invites, public.tenant_features,
                public.audit_log, public.tenant_effective_features to authenticated;

-- Escritura, columna a columna.
-- El coach puede cambiar nombre, marca y ajustes. NO puede cambiar plan ni status.
-- Por eso "settings" y "branding" no deben guardar nunca nada que dé permisos
-- o límites: solo preferencias y aspecto.
grant update (name, branding, settings) on public.tenants to authenticated;
grant update (display_name, locale, weight_unit) on public.profiles to authenticated;
-- El coach solo puede archivar o reactivar clientes (columna status).
grant update (status) on public.tenant_members to authenticated;

-- Funciones que puede llamar un usuario con sesión
grant execute on function public.is_member(uuid, text[])            to authenticated;
grant execute on function public.create_tenant(text)                to authenticated;
grant execute on function public.preview_invite(text)               to authenticated;
grant execute on function public.join_tenant_with_code(text)        to authenticated;
grant execute on function public.regenerate_invite_code(uuid)       to authenticated;


-- ---------------------------------------------------------------------
-- 10. RLS: qué filas puede ver o tocar cada usuario
-- ---------------------------------------------------------------------
alter table public.plans           enable row level security;
alter table public.tenants         enable row level security;
alter table public.profiles        enable row level security;
alter table public.tenant_members  enable row level security;
alter table public.tenant_invites  enable row level security;
alter table public.features        enable row level security;
alter table public.plan_features   enable row level security;
alter table public.tenant_features enable row level security;
alter table public.audit_log       enable row level security;

-- Catálogos: lectura para cualquier usuario con sesión.
create policy plans_read         on public.plans         for select to authenticated using (true);
create policy features_read      on public.features      for select to authenticated using (true);
create policy plan_features_read on public.plan_features for select to authenticated using (true);

-- Tenants: lo ven sus miembros; lo edita solo el dueño.
create policy tenants_read on public.tenants for select to authenticated
  using (public.is_member(id));
create policy tenants_update on public.tenants for update to authenticated
  using (public.is_member(id, array['owner']))
  with check (public.is_member(id, array['owner']));

-- Profiles: cada uno el suyo; el coach ve los de los miembros de su tenant.
create policy profiles_read on public.profiles for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tenant_members m
      where m.user_id = profiles.user_id
        and public.is_member(m.tenant_id, array['owner','staff'])
    )
  );
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Miembros: cada uno ve su fila; el coach ve todas las de su tenant.
create policy members_read on public.tenant_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(tenant_id, array['owner','staff']));
-- El coach puede archivar o reactivar a sus CLIENTES (no a otros coaches).
create policy members_update on public.tenant_members for update to authenticated
  using (role = 'client' and public.is_member(tenant_id, array['owner','staff']))
  with check (role = 'client' and public.is_member(tenant_id, array['owner','staff']));

-- Código de invitación: solo lo ve el coach.
create policy invites_read on public.tenant_invites for select to authenticated
  using (public.is_member(tenant_id, array['owner','staff']));

-- Flags del tenant: los ven sus miembros.
create policy tenant_features_read on public.tenant_features for select to authenticated
  using (public.is_member(tenant_id));

-- Registro de acciones: solo el dueño.
create policy audit_read on public.audit_log for select to authenticated
  using (public.is_member(tenant_id, array['owner']));

-- Sin políticas de inserción ni borrado: esas operaciones solo ocurren
-- dentro de las funciones del apartado 8 o desde el servidor.

