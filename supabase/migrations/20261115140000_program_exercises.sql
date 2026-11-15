-- =====================================================================
-- Migración 12: ejercicios de cada día y series (Fase 2, PR 2.5b)
--
-- Los dos últimos niveles de una rutina (DECISIONES D-072, D-076, D-077 y
-- D-086). Como en la migración 11, desde la app solo se leen: se escriben
-- con funciones (PR 2.6 y 2.12).
--
-- Además: el cliente pasa a leer los ejercicios que aparecen en sus
-- rutinas, y la forma de medir de un ejercicio deja de poder cambiarse
-- cuando ya está en una rutina (D-072).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EJERCICIOS DE CADA DÍA
-- ---------------------------------------------------------------------
create table public.program_day_exercises (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  program_id      uuid not null,
  day_id          uuid not null,
  position        smallint not null check (position between 1 and 30),
  exercise_id     uuid not null,
  -- Los ejercicios seguidos de un día con el mismo número forman una
  -- superserie o un circuito (D-077). El botón llega en el PR 2.17.
  superset_group  smallint check (superset_group between 1 and 15),
  -- Descanso entre series, en segundos, y nota del coach, que el cliente ve.
  rest_seconds    integer check (rest_seconds between 0 and 3600),
  note            text check (char_length(note) between 1 and 500),
  unique (tenant_id, id),
  unique (tenant_id, program_id, id),
  unique (day_id, position) deferrable initially deferred,
  foreign key (tenant_id, program_id, day_id)
    references public.program_days (tenant_id, program_id, id) on delete cascade,
  -- Caso 17: solo ejercicios de este negocio. Sin "cascade": un ejercicio
  -- no se borra nunca (D-073).
  foreign key (tenant_id, exercise_id)
    references public.exercises (tenant_id, id)
);
create index program_day_exercises_program_idx
  on public.program_day_exercises (tenant_id, program_id);
-- En qué rutinas está un ejercicio: lo usan el apartado 3 y el 4.
create index program_day_exercises_exercise_idx
  on public.program_day_exercises (tenant_id, exercise_id);


-- ---------------------------------------------------------------------
-- 2. SERIES
--    Una fila por serie, aunque todas sean iguales: es lo que apuntará el
--    cliente en la Fase 3 (D-076 y D-087). Todo lo prescrito es opcional.
-- ---------------------------------------------------------------------
create table public.program_sets (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  program_id        uuid not null,
  day_exercise_id   uuid not null,
  position          smallint not null check (position between 1 and 10),
  -- Repeticiones: fijas (mínima = máxima) o en rango.
  reps_min          smallint check (reps_min between 1 and 100),
  reps_max          smallint check (reps_max between 1 and 100),
  -- Según la forma de medir del ejercicio (D-072), tiempo o distancia.
  duration_seconds  integer check (duration_seconds between 1 and 86400),
  distance_meters   integer check (distance_meters between 1 and 1000000),
  -- RIR de 0 a 10, RPE de 1 a 10 con medios puntos, o al fallo.
  intensity_type    text check (intensity_type in ('rir','rpe','failure')),
  intensity_value   numeric(3,1),
  -- Siempre en kg (AGENTS §4).
  target_load_kg    numeric(6,2) check (target_load_kg between 0 and 1000),
  unique (tenant_id, id),
  unique (day_exercise_id, position) deferrable initially deferred,
  foreign key (tenant_id, program_id, day_exercise_id)
    references public.program_day_exercises (tenant_id, program_id, id) on delete cascade,
  constraint program_sets_reps check (
    (reps_min is null and reps_max is null)
    or (reps_min is not null and reps_max is not null and reps_min <= reps_max)
  ),
  constraint program_sets_one_target check (
    num_nonnulls(reps_min, duration_seconds, distance_meters) <= 1
  ),
  constraint program_sets_intensity check (
    case intensity_type
      when 'rir' then intensity_value between 0 and 10 and intensity_value = trunc(intensity_value)
      when 'rpe' then intensity_value between 1 and 10 and intensity_value * 2 = trunc(intensity_value * 2)
      else intensity_value is null
    end
  )
);
create index program_sets_program_idx on public.program_sets (tenant_id, program_id);


-- ---------------------------------------------------------------------
-- 3. EL CLIENTE LEE LOS EJERCICIOS DE SUS RUTINAS, Y SOLO ESOS
--    Hasta ahora no leía ninguno (migración 8). SECURITY DEFINER por lo
--    mismo que is_program_client: solo responde sí o no sobre el propio
--    usuario.
-- ---------------------------------------------------------------------
create function public.is_exercise_in_my_programs(p_tenant uuid, p_exercise uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.program_day_exercises de
    join public.programs p on p.id = de.program_id
    where de.tenant_id = p_tenant
      and de.exercise_id = p_exercise
      and p.client_id = auth.uid()
  ) and public.is_member(p_tenant, array['client']);
$$;

create policy exercises_read_client on public.exercises for select to authenticated
  using (public.is_exercise_in_my_programs(tenant_id, id));


-- ---------------------------------------------------------------------
-- 4. LA REGLA DE D-072
--    La forma de medir y "unilateral" de un ejercicio no cambian si ya
--    está en alguna rutina: lo prescrito dejaría de tener sentido. Para
--    cambiarlas, el coach duplica el ejercicio.
-- ---------------------------------------------------------------------
create function public.protect_exercise_in_use()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.program_day_exercises de
    where de.tenant_id = old.tenant_id and de.exercise_id = old.id
  ) then
    raise exception 'exercise_in_use';
  end if;
  return new;
end;
$$;

create trigger exercises_protect_in_use
  before update of measurement, is_unilateral on public.exercises
  for each row
  when (old.measurement is distinct from new.measurement
        or old.is_unilateral is distinct from new.is_unilateral)
  execute function public.protect_exercise_in_use();


-- ---------------------------------------------------------------------
-- 5. PERMISOS Y RLS (solo lectura, como en la migración 11)
-- ---------------------------------------------------------------------
grant select on public.program_day_exercises, public.program_sets to authenticated;
grant execute on function public.is_exercise_in_my_programs(uuid, uuid) to authenticated;

alter table public.program_day_exercises enable row level security;
alter table public.program_sets          enable row level security;

create policy program_day_exercises_read on public.program_day_exercises
  for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );

create policy program_sets_read on public.program_sets for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );

-- Sin políticas de escritura: nadie escribe directamente.
