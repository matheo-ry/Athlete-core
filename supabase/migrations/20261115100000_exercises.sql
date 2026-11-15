-- =====================================================================
-- Migración 8: ejercicios (Fase 2, PR 2.1)
--
-- Dos tablas (DECISIONES D-071 a D-073 y D-086):
--   * exercise_library: el catálogo de la plataforma. Sin tenant_id y de
--     solo lectura, como plans o features (ARQUITECTURA §8). Aquí queda
--     vacío: los 120 ejercicios llegan en el PR 2.2.
--   * exercises: los ejercicios de cada negocio. Tabla de negocio según la
--     plantilla. Cada negocio recibe al crearse una copia del catálogo.
--
-- El flag "exercises" NO va en esta migración: el test 04 exige que el
-- catálogo de flags tenga uno por módulo, y el módulo llega en el PR 2.3.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL CATÁLOGO DE LA PLATAFORMA
--    La clave es fija y en inglés, como en plans y features: no se ve en
--    la app y no cambia nunca, así que sirve de identificador.
--    Las listas cerradas de D-072 se repiten en exercises (apartado 2):
--    si cambia una, cambian las dos.
-- ---------------------------------------------------------------------
create table public.exercise_library (
  key            text primary key check (key ~ '^[a-z][a-z0-9_]{1,59}$'),
  name_en        text not null check (char_length(name_en) between 1 and 80),
  name_es        text not null check (char_length(name_es) between 1 and 80),
  muscle_group   text not null check (muscle_group in (
                   'chest','back','shoulders','biceps','triceps','forearms','abs',
                   'quads','hamstrings','glutes','adductors','calves','full_body','cardio')),
  equipment      text not null check (equipment in (
                   'barbell','dumbbells','machine','cable','bodyweight','band','kettlebell','other')),
  measurement    text not null check (measurement in (
                   'weight_reps','bodyweight_reps','time','distance')),
  is_unilateral  boolean not null default false
);


-- ---------------------------------------------------------------------
-- 2. LOS EJERCICIOS DE CADA NEGOCIO
-- ---------------------------------------------------------------------
create table public.exercises (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  -- De qué ejercicio del catálogo viene. Vacío en los que crea el coach.
  library_key    text references public.exercise_library(key),
  -- Vacío mientras valga el nombre del catálogo: así cada usuario lo ve en
  -- su idioma (D-071). "Restaurar original" lo vuelve a dejar vacío.
  name           text check (char_length(name) between 1 and 80 and btrim(name) <> ''),
  measurement    text not null check (measurement in (
                   'weight_reps','bodyweight_reps','time','distance')),
  is_unilateral  boolean not null default false,
  muscle_group   text check (muscle_group in (
                   'chest','back','shoulders','biceps','triceps','forearms','abs',
                   'quads','hamstrings','glutes','adductors','calves','full_body','cardio')),
  equipment      text check (equipment in (
                   'barbell','dumbbells','machine','cable','bodyweight','band','kettlebell','other')),
  instructions   text check (char_length(instructions) <= 2000),
  -- Solo https:// (D-074). El tope de 500 evita guardar textos enormes.
  video_url      text check (video_url ~ '^https://\S+$' and char_length(video_url) <= 500),
  archived_at    timestamptz,
  -- Vacío en las copias del catálogo: no las creó ningún usuario.
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, id),
  -- Una sola copia de cada ejercicio del catálogo por negocio: repetir la
  -- copia no duplica nada (lo usa el PR 2.2).
  unique (tenant_id, library_key),
  -- Un ejercicio sin nombre propio tiene que venir del catálogo.
  constraint exercises_name_or_library check (name is not null or library_key is not null)
);

-- Los que están sin archivar: es lo que lista la app y lo que cuenta el tope.
create index exercises_active_idx on public.exercises (tenant_id) where archived_at is null;

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. EL TOPE DE D-086: 1.000 ejercicios sin archivar por negocio
--    Se comprueba al crear y al recuperar uno archivado. SECURITY DEFINER
--    porque tiene que contar todos los del negocio y bloquear su fila de
--    tenants, y el RLS de quien escribe no siempre deja (staff).
-- ---------------------------------------------------------------------
create function public.enforce_exercise_limit()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.archived_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;

  -- Bloquea el negocio para que dos altas a la vez no se salten el tope.
  perform 1 from public.tenants where id = new.tenant_id for update;

  if (select count(*) from public.exercises
      where tenant_id = new.tenant_id and archived_at is null) >= 1000 then
    raise exception 'exercise_limit_reached';
  end if;
  return new;
end;
$$;

create trigger exercises_enforce_limit
  before insert or update of archived_at on public.exercises
  for each row execute function public.enforce_exercise_limit();


-- ---------------------------------------------------------------------
-- 4. LA COPIA DEL CATÁLOGO PARA CADA NEGOCIO NUEVO (D-071)
--    Con un trigger propio, sin tocar create_tenant: vale también para un
--    negocio creado de cualquier otra forma. El nombre queda vacío: se
--    lee del catálogo, en el idioma de cada usuario.
-- ---------------------------------------------------------------------
create function public.copy_exercise_library_to_tenant()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.exercises
    (tenant_id, library_key, measurement, is_unilateral, muscle_group, equipment)
  select new.id, l.key, l.measurement, l.is_unilateral, l.muscle_group, l.equipment
  from public.exercise_library l
  on conflict (tenant_id, library_key) do nothing;
  return new;
end;
$$;

create trigger tenants_copy_exercise_library
  after insert on public.tenants
  for each row execute function public.copy_exercise_library_to_tenant();


-- ---------------------------------------------------------------------
-- 5. PERMISOS (las tablas y funciones nuevas nacen sin permisos, D-032)
--    Sin "delete": un ejercicio nunca se borra, se archiva (D-073).
--    Columna a columna: el coach no elige el id, las fechas ni el origen
--    de un ejercicio, y no puede moverlo a otro negocio.
-- ---------------------------------------------------------------------
grant select on public.exercise_library to authenticated;

grant select on public.exercises to authenticated;
grant insert (tenant_id, name, measurement, is_unilateral, muscle_group, equipment,
              instructions, video_url, created_by)
  on public.exercises to authenticated;
grant update (name, measurement, is_unilateral, muscle_group, equipment,
              instructions, video_url, archived_at)
  on public.exercises to authenticated;


-- ---------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------
alter table public.exercise_library enable row level security;
alter table public.exercises        enable row level security;

-- Catálogo: lectura para cualquier usuario con sesión. Sin más políticas.
create policy exercise_library_read on public.exercise_library
  for select to authenticated using (true);

-- Ejercicios: los lee, los crea y los edita el coach de ese negocio.
-- El cliente todavía no lee nada: llega con las rutinas (PR 2.5).
create policy exercises_read on public.exercises for select to authenticated
  using (public.is_member(tenant_id, array['owner','staff']));
create policy exercises_insert on public.exercises for insert to authenticated
  with check (public.is_member(tenant_id, array['owner','staff']) and created_by = auth.uid());
create policy exercises_update on public.exercises for update to authenticated
  using (public.is_member(tenant_id, array['owner','staff']))
  with check (public.is_member(tenant_id, array['owner','staff']));

-- Sin política de borrado: nadie borra un ejercicio.
