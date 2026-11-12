-- =====================================================================
-- PLANTILLA PARA TABLAS DE NEGOCIO (ejemplo con rutinas)
--
-- Es un EJEMPLO del patrón, no el diseño definitivo de ningún módulo.
-- El diseño real de cada tabla se decide en la fase de su módulo.
-- Requiere docs/referencia/esquema-base.sql aplicado antes.
--
-- Lo que toda tabla de negocio debe tener:
--   1. tenant_id NOT NULL + clave foránea a tenants
--   2. unique (tenant_id, id)
--   3. Claves foráneas COMPUESTAS hacia otras tablas de negocio
--   4. Índices que empiecen por tenant_id
--   5. Permisos explícitos (revoke + grant)
--   6. RLS activado + políticas por rol
--   7. Un test de aislamiento en supabase/tests/
-- =====================================================================

-- Tabla "padre": rutinas que crea el coach
create table public.programs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, id)                         -- (2)
);
create index programs_tenant_idx on public.programs (tenant_id, created_at desc);  -- (4)

-- Si la tabla tiene updated_at, se mantiene sola con este trigger.
create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

-- Tabla "hija": a qué cliente se asigna cada rutina
create table public.program_assignments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  program_id  uuid not null,
  client_id   uuid not null,
  starts_on   date not null default current_date,
  created_at  timestamptz not null default now(),
  unique (tenant_id, id),
  -- (3) Con la clave compuesta, la base de datos IMPIDE asignar la rutina
  --     de un coach al cliente de otro coach.
  foreign key (tenant_id, program_id)
    references public.programs (tenant_id, id) on delete cascade,
  foreign key (tenant_id, client_id)
    references public.tenant_members (tenant_id, user_id) on delete cascade
);
create index program_assignments_client_idx
  on public.program_assignments (tenant_id, client_id);

-- (5) Permisos
revoke all on public.programs, public.program_assignments from anon, authenticated;
grant select, insert, update, delete
  on public.programs, public.program_assignments to authenticated;

-- (6) RLS
alter table public.programs            enable row level security;
alter table public.program_assignments enable row level security;

-- Rutinas: las lee cualquier miembro del tenant; las escribe el coach.
create policy programs_read on public.programs for select to authenticated
  using (public.is_member(tenant_id));
create policy programs_insert on public.programs for insert to authenticated
  with check (public.is_member(tenant_id, array['owner','staff']) and created_by = auth.uid());
create policy programs_update on public.programs for update to authenticated
  using (public.is_member(tenant_id, array['owner','staff']))
  with check (public.is_member(tenant_id, array['owner','staff']));
create policy programs_delete on public.programs for delete to authenticated
  using (public.is_member(tenant_id, array['owner','staff']));

-- Asignaciones: el cliente ve las suyas; el coach las ve y las gestiona todas.
create policy assignments_read on public.program_assignments for select to authenticated
  using (
    (client_id = auth.uid() and public.is_member(tenant_id))
    or public.is_member(tenant_id, array['owner','staff'])
  );
create policy assignments_insert on public.program_assignments for insert to authenticated
  with check (public.is_member(tenant_id, array['owner','staff']));
create policy assignments_update on public.program_assignments for update to authenticated
  using (public.is_member(tenant_id, array['owner','staff']))
  with check (public.is_member(tenant_id, array['owner','staff']));
create policy assignments_delete on public.program_assignments for delete to authenticated
  using (public.is_member(tenant_id, array['owner','staff']));

-- Nota: programs_read deja que un cliente lea TODAS las rutinas de su coach.
-- Si en el diseño real el cliente solo debe ver las que tiene asignadas,
-- la política de lectura tiene que comprobarlo (y hay que probarlo en un test).
