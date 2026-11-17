-- =====================================================================
-- Migración 21: set-up, ajustes de entreno y el interruptor de logros
-- (Fase 3, PR 3.3b)
--
-- El set-up de cada cliente en cada ejercicio (D-122), sus ajustes de
-- entreno (D-120 y D-123) y el interruptor de logros del negocio (D-130).
-- Decisión D-141.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL SET-UP DEL CLIENTE (D-122)
--    Uno por cliente y ejercicio, compartido entre todas sus rutinas:
--    "Asiento 2 · Agarre línea 3". No es dato de salud (D-126). Lo
--    escribe el cliente; el coach lo lee y no lo edita.
-- ---------------------------------------------------------------------
create table public.client_exercise_setups (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  client_id    uuid not null references auth.users(id) on delete cascade,
  exercise_id  uuid not null,
  setup        text not null check (char_length(btrim(setup)) between 1 and 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, client_id, exercise_id),
  foreign key (tenant_id, exercise_id)
    references public.exercises (tenant_id, id) on delete cascade
);

create trigger client_exercise_setups_set_updated_at
  before update on public.client_exercise_setups
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.client_exercise_setups to authenticated;
alter table public.client_exercise_setups enable row level security;

create policy client_exercise_setups_read on public.client_exercise_setups
  for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or (client_id = auth.uid() and public.is_member(tenant_id, array['client']))
  );
-- El ejercicio tiene que ser de ese negocio: lo asegura la clave foránea.
create policy client_exercise_setups_write on public.client_exercise_setups
  for all to authenticated
  using (client_id = auth.uid() and public.is_member(tenant_id, array['client']))
  with check (client_id = auth.uid() and public.is_member(tenant_id, array['client']));


-- ---------------------------------------------------------------------
-- 2. AJUSTES DE ENTRENO DEL CLIENTE (D-120 y D-123)
--    Son de la persona, no del negocio: van en profiles y valen en todos
--    sus espacios. Los edita cada uno en el suyo (política profiles_update).
--      same_button: 'previous' = "Igual" copia la vez anterior en esa
--      serie; 'previous_then_today' = la serie 1 copia la vez anterior y
--      las siguientes, la serie anterior de hoy.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column default_rest_seconds integer not null default 120
    check (default_rest_seconds between 0 and 3600),
  add column rest_autostart      boolean not null default true,
  add column rest_sound          boolean not null default true,
  add column rest_vibration      boolean not null default true,
  add column same_button         text not null default 'previous'
    check (same_button in ('previous','previous_then_today'));

grant update (default_rest_seconds, rest_autostart, rest_sound, rest_vibration, same_button)
  on public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 3. EL INTERRUPTOR DE LOGROS (D-130)
--    En tenants.settings, que solo guarda preferencias, con la clave
--    "achievementsEnabled". Sin la clave, están activados. Lo cambia solo
--    el dueño (política tenants_update); aquí se asegura que sea un sí o
--    un no.
-- ---------------------------------------------------------------------
alter table public.tenants
  add constraint tenants_settings_achievements_check
  check (not (settings ? 'achievementsEnabled')
         or jsonb_typeof(settings -> 'achievementsEnabled') = 'boolean');

-- ¿Ese negocio tiene los logros activados? Para quien los calcule.
create function public.achievements_enabled(p_tenant uuid)
returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select (t.settings ->> 'achievementsEnabled')::boolean
                   from public.tenants t where t.id = p_tenant), true);
$$;
grant execute on function public.achievements_enabled(uuid) to authenticated;
