-- =====================================================================
-- Migración 17: entrenos (Fase 3, PR 3.2a)
--
-- Lo que apunta el cliente al entrenar (DECISIONES D-087, D-118 a D-122,
-- D-124 y D-138): el entreno, sus ejercicios y sus series.
--
-- Como las rutinas, desde la app solo se leen. Se escriben con dos
-- funciones: sync_workout (subir un entreno entero desde el móvil) y
-- discard_workout (descartarlo). Nadie más escribe ni borra.
--
-- Los identificadores los crea el móvil (D-118): las tablas no tienen
-- valor por defecto para "id", y subir dos veces lo mismo no duplica nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL ENTRENO
--    Apunta a la rutina, al bloque y al día que se hicieron. Si el coach
--    borra luego ese bloque o ese día, el entreno se queda y pierde el
--    enlace (set null), pero guarda su número de día (D-125).
-- ---------------------------------------------------------------------
create table public.workouts (
  id               uuid primary key,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  client_id        uuid not null,
  program_id       uuid,
  block_id         uuid,
  program_day_id   uuid,
  day_number       smallint not null check (day_number between 1 and 28),
  -- La fecha del último dato cambiado, en la zona del móvil (D-119).
  performed_on     date not null,
  started_at       timestamptz not null,
  last_changed_at  timestamptz not null,
  closed_at        timestamptz,
  -- manual: "Terminar entreno"; completed: todo hecho o saltado;
  -- timeout: 12 horas sin tocarlo (D-119).
  close_reason     text check (close_reason in ('manual','completed','timeout')),
  -- El móvil que lo tiene abierto (D-124) y desde cuándo: al empezar o al
  -- pulsar "Seguir aquí". Gana el que lo tomó más tarde, así lo que suba
  -- con retraso el otro móvil no se lo vuelve a quitar. Vacío al cerrarse.
  open_device_id   text check (char_length(open_device_id) between 1 and 64),
  device_since     timestamptz,
  -- Última corrección de un entreno ya cerrado: el coach ve "Editado".
  edited_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, client_id)
    references public.tenant_members (tenant_id, user_id) on delete cascade,
  foreign key (tenant_id, program_id)
    references public.programs (tenant_id, id) on delete set null (program_id),
  foreign key (tenant_id, program_id, block_id)
    references public.program_blocks (tenant_id, program_id, id) on delete set null (block_id),
  foreign key (tenant_id, program_id, program_day_id)
    references public.program_days (tenant_id, program_id, id) on delete set null (program_day_id),
  constraint workouts_closed check ((closed_at is null) = (close_reason is null)),
  constraint workouts_times check (last_changed_at >= started_at and closed_at >= started_at)
);
-- El historial de un cliente, del más nuevo al más viejo.
create index workouts_client_idx on public.workouts (tenant_id, client_id, performed_on desc);
create index workouts_program_idx on public.workouts (tenant_id, program_id) where program_id is not null;

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. LOS EJERCICIOS DEL ENTRENO
--    Con su COPIA de lo prescrito ese día (D-087): si el coach cambia la
--    rutina, el pasado no cambia. exercise_id es el que se hizo de verdad;
--    si fue un cambio, replaces_exercise_id es el de la rutina (D-122).
-- ---------------------------------------------------------------------
create table public.workout_exercises (
  id                       uuid primary key,
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  workout_id               uuid not null,
  position                 smallint not null check (position between 1 and 30),
  exercise_id              uuid not null,
  -- De qué ejercicio de la rutina sale. Solo para encontrarlo; lo que vale
  -- es la copia de abajo.
  program_day_exercise_id  uuid,
  superset_group           smallint check (superset_group between 1 and 15),
  -- Copia de las series prescritas, con la forma de program_sets:
  -- [{ reps_min, reps_max, duration_seconds, distance_meters,
  --    intensity_type, intensity_value, target_load_kg }]
  prescribed_sets          jsonb not null default '[]'::jsonb
                           check (jsonb_typeof(prescribed_sets) = 'array'
                                  and jsonb_array_length(prescribed_sets) <= 10),
  prescribed_rest_seconds  integer check (prescribed_rest_seconds between 0 and 3600),
  coach_note               text check (char_length(coach_note) between 1 and 500),
  is_skipped               boolean not null default false,
  replaces_exercise_id     uuid,
  -- Nota del día del cliente. Es dato de salud (D-122 y D-126).
  day_note                 text check (char_length(day_note) between 1 and 500),
  -- Cuándo cambió en el móvil: al subir, gana el cambio más reciente (D-124).
  changed_at               timestamptz not null,
  unique (tenant_id, id),
  unique (tenant_id, workout_id, id),
  unique (workout_id, position) deferrable initially deferred,
  foreign key (tenant_id, workout_id)
    references public.workouts (tenant_id, id) on delete cascade,
  -- Solo ejercicios de este negocio. Sin "cascade": no se borran (D-073).
  foreign key (tenant_id, exercise_id) references public.exercises (tenant_id, id),
  foreign key (tenant_id, replaces_exercise_id) references public.exercises (tenant_id, id),
  foreign key (tenant_id, program_day_exercise_id)
    references public.program_day_exercises (tenant_id, id) on delete set null (program_day_exercise_id),
  constraint workout_exercises_replacement check (replaces_exercise_id <> exercise_id)
);
create index workout_exercises_workout_idx on public.workout_exercises (tenant_id, workout_id);
-- El historial y el progreso de un ejercicio (PR 3.15).
create index workout_exercises_exercise_idx on public.workout_exercises (tenant_id, exercise_id);


-- ---------------------------------------------------------------------
-- 3. LAS SERIES
--    Una fila por serie y por lado (D-121). Una serie es su número y su
--    lado dentro del ejercicio: si dos móviles apuntan la misma, queda
--    una sola fila, con el cambio más reciente (D-124). Desmarcar una
--    serie (D-120) no la borra: queda con is_done = false, y así ese
--    cambio también gana o pierde por la hora.
-- ---------------------------------------------------------------------
create table public.workout_sets (
  id                   uuid primary key,
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  workout_id           uuid not null,
  workout_exercise_id  uuid not null,
  set_number           smallint not null check (set_number between 1 and 10),
  side                 text not null default 'none' check (side in ('none','right','left')),
  -- Siempre en kg (AGENTS §4). En peso corporal, el lastre (D-087).
  weight_kg            numeric(6,2) check (weight_kg between 0 and 1000),
  reps                 smallint check (reps between 0 and 1000),
  duration_seconds     integer check (duration_seconds between 1 and 86400),
  distance_meters      integer check (distance_meters between 1 and 1000000),
  intensity_type       text check (intensity_type in ('rir','rpe','failure')),
  intensity_value      numeric(3,1),
  -- Una serie más que las prescritas ("+ Serie", D-120).
  is_extra             boolean not null default false,
  is_done              boolean not null default true,
  -- Cuándo se apuntó o se cambió por última vez, en el móvil.
  recorded_at          timestamptz not null,
  unique (tenant_id, id),
  unique (workout_exercise_id, set_number, side),
  foreign key (tenant_id, workout_id, workout_exercise_id)
    references public.workout_exercises (tenant_id, workout_id, id) on delete cascade,
  constraint workout_sets_intensity check (
    case intensity_type
      when 'rir' then intensity_value between 0 and 10 and intensity_value = trunc(intensity_value)
      when 'rpe' then intensity_value between 1 and 10 and intensity_value * 2 = trunc(intensity_value * 2)
      else intensity_value is null
    end
  )
);
create index workout_sets_workout_idx on public.workout_sets (tenant_id, workout_id);


-- ---------------------------------------------------------------------
-- 4. ¿ES MÍO ESTE ENTRENO?
--    Para las políticas de las tablas hijas, como is_program_client.
-- ---------------------------------------------------------------------
create function public.is_workout_client(p_tenant uuid, p_workout uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workouts w
    where w.id = p_workout and w.tenant_id = p_tenant and w.client_id = auth.uid()
  ) and public.is_member(p_tenant, array['client']);
$$;


-- ---------------------------------------------------------------------
-- 5. LA REGLA DE D-072, TAMBIÉN CON ENTRENOS
--    Si un ejercicio ya tiene series apuntadas, su forma de medir no
--    cambia aunque ya no esté en ninguna rutina: el historial dejaría de
--    tener sentido.
-- ---------------------------------------------------------------------
create or replace function public.protect_exercise_in_use()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.program_day_exercises de
    where de.tenant_id = old.tenant_id and de.exercise_id = old.id
  ) or exists (
    select 1 from public.workout_exercises we
    where we.tenant_id = old.tenant_id and old.id in (we.exercise_id, we.replaces_exercise_id)
  ) then
    raise exception 'exercise_in_use';
  end if;
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. PERMISOS Y RLS
--    Solo lectura. El cliente lee los suyos; el coach (owner y staff), los
--    de su negocio. Un cliente dado de baja no lee nada: is_member solo
--    cuenta a los que están de alta.
-- ---------------------------------------------------------------------
grant select on public.workouts, public.workout_exercises, public.workout_sets to authenticated;
grant execute on function public.is_workout_client(uuid, uuid) to authenticated;

alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets      enable row level security;

create policy workouts_read on public.workouts for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or (client_id = auth.uid() and public.is_member(tenant_id, array['client']))
  );

create policy workout_exercises_read on public.workout_exercises for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_workout_client(tenant_id, workout_id)
  );

create policy workout_sets_read on public.workout_sets for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_workout_client(tenant_id, workout_id)
  );


-- ---------------------------------------------------------------------
-- 7. EL FLAG DEL MÓDULO workouts (core: activo para todos, D-019)
-- ---------------------------------------------------------------------
insert into public.features (key, kind, description) values
  ('workouts', 'core', 'Entrenos del cliente: apuntar, subir y corregir (módulo workouts).');
