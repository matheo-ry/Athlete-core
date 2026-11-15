-- =====================================================================
-- Migración 11: rutinas, bloques y días (Fase 2, PR 2.5a)
--
-- Los tres primeros niveles de una rutina (DECISIONES D-075, D-078, D-081
-- a D-083 y D-086). Los ejercicios de cada día y sus series llegan en la
-- migración siguiente (PR 2.5b).
--
-- Nadie escribe en estas tablas desde la app: solo se leen. Se escriben
-- con funciones (PR 2.6 y 2.12), como las demás operaciones sensibles
-- (ARQUITECTURA §8). Por eso varias reglas que cruzan filas (qué bloque
-- puede no tener fin, que haya una fila por cada día del ciclo) las
-- comprueba la función que guarda, no un "check".
--
-- El flag "programs" NO va en esta migración: llega con el módulo, en el
-- PR 2.7 (el test 04 exige un flag por módulo que exista).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RUTINAS
--    Sin cliente = plantilla (D-078). Con cliente = la copia de ese
--    cliente, con su fecha de inicio y su modo.
-- ---------------------------------------------------------------------
create table public.programs (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 80 and btrim(name) <> ''),
  client_id          uuid,
  -- De qué rutina salió esta copia. Solo informativo: sin clave foránea,
  -- para que nada dependa de que la original siga existiendo.
  source_program_id  uuid,
  -- Desde cuándo se cuenta (D-081) y desde qué bloque (D-083; vacío = el
  -- primero). "Reiniciar desde una fecha" cambia los dos.
  starts_on          date,
  start_block_id     uuid,
  mode               text not null default 'calendar' check (mode in ('calendar','list')),
  -- El coach la terminó (D-081): deja de ser la vigente y pasa a "Anteriores".
  ended_at           timestamptz,
  -- Solo las plantillas se archivan.
  archived_at        timestamptz,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, id),
  -- Caso 16: la clave compuesta impide poner a un cliente de otro negocio.
  foreign key (tenant_id, client_id)
    references public.tenant_members (tenant_id, user_id) on delete cascade,
  constraint programs_template_or_client check (
    (client_id is null and starts_on is null and start_block_id is null and ended_at is null)
    or (client_id is not null and starts_on is not null and archived_at is null)
  )
);

-- Las rutinas de un cliente (su ficha y lo que ve él) y las plantillas sin
-- archivar (la lista del coach y el tope de 300).
create index programs_client_idx on public.programs (tenant_id, client_id)
  where client_id is not null;
create index programs_templates_idx on public.programs (tenant_id)
  where client_id is null and archived_at is null;

create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. BLOQUES
--    Cada tabla hija lleva también program_id, y su clave foránea hacia el
--    nivel de arriba lo incluye: así una fila no puede colgar de un bloque
--    de otra rutina, y el RLS sabe de qué rutina es sin recorrer niveles.
-- ---------------------------------------------------------------------
create table public.program_blocks (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  program_id  uuid not null,
  position    smallint not null check (position between 1 and 12),
  name        text check (char_length(name) between 1 and 40),
  cycle_days  smallint not null check (cycle_days between 1 and 28),
  -- Vueltas completas del ciclo. Vacío = sin fecha de fin (D-075).
  laps        smallint check (laps between 1 and 52),
  unique (tenant_id, id),
  unique (tenant_id, program_id, id),
  -- Se comprueba al final de la transacción, para poder reordenar.
  unique (program_id, position) deferrable initially deferred,
  foreign key (tenant_id, program_id)
    references public.programs (tenant_id, id) on delete cascade
);
create index program_blocks_program_idx on public.program_blocks (tenant_id, program_id);

-- El bloque de inicio tiene que ser de esta misma rutina. Si el bloque se
-- borra, se vuelve a contar desde el primero.
alter table public.programs
  add constraint programs_start_block_fkey
  foreign key (tenant_id, id, start_block_id)
  references public.program_blocks (tenant_id, program_id, id)
  on delete set null (start_block_id);


-- ---------------------------------------------------------------------
-- 3. DÍAS DEL CICLO
--    Los descansos son días del ciclo y los coloca el coach (D-075).
-- ---------------------------------------------------------------------
create table public.program_days (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  program_id  uuid not null,
  block_id    uuid not null,
  day_number  smallint not null check (day_number between 1 and 28),
  kind        text not null check (kind in ('training','rest')),
  name        text check (char_length(name) between 1 and 40),
  subtitle    text check (char_length(subtitle) between 1 and 60),
  place       text check (char_length(place) between 1 and 20),
  unique (tenant_id, id),
  unique (tenant_id, program_id, id),
  unique (block_id, day_number) deferrable initially deferred,
  foreign key (tenant_id, program_id, block_id)
    references public.program_blocks (tenant_id, program_id, id) on delete cascade
);
create index program_days_program_idx on public.program_days (tenant_id, program_id);


-- ---------------------------------------------------------------------
-- 4. ¿ES MÍA ESTA RUTINA?
--    Para las políticas de las tablas hijas: el cliente lee el contenido de
--    las rutinas en las que él es el cliente, mientras siga de alta.
--    SECURITY DEFINER para no pasar otra vez por el RLS de programs en cada
--    fila. Solo responde sí o no, y solo sobre el propio usuario.
-- ---------------------------------------------------------------------
create function public.is_program_client(p_tenant uuid, p_program uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.programs p
    where p.id = p_program
      and p.tenant_id = p_tenant
      and p.client_id = auth.uid()
  ) and public.is_member(p_tenant, array['client']);
$$;


-- ---------------------------------------------------------------------
-- 5. PERMISOS (las tablas y funciones nuevas nacen sin permisos, D-032)
--    Solo lectura: sin insert, update ni delete para nadie.
-- ---------------------------------------------------------------------
grant select on public.programs, public.program_blocks, public.program_days to authenticated;
grant execute on function public.is_program_client(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 6. RLS
--    El coach lee todas las rutinas de su negocio. El cliente, solo las
--    suyas: nunca plantillas ni rutinas de otros (D-078). Un cliente dado
--    de baja no lee nada: is_member solo cuenta a los que están de alta.
-- ---------------------------------------------------------------------
alter table public.programs       enable row level security;
alter table public.program_blocks enable row level security;
alter table public.program_days   enable row level security;

create policy programs_read on public.programs for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or (client_id = auth.uid() and public.is_member(tenant_id, array['client']))
  );

create policy program_blocks_read on public.program_blocks for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );

create policy program_days_read on public.program_days for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );

-- Sin políticas de escritura: nadie escribe directamente.
