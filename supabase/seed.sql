-- =====================================================================
-- Datos inventados para desarrollo en local (ARQUITECTURA §4).
-- Se cargan solos con "npm run db:reset". Nunca datos reales.
--
-- 2 coaches y 6 clientes:
--   * Iron Lab (coach.iron@example.com), código IRONLAB1, plan free (3):
--     clientes ana, bruno y carla. El plan está LLENO.
--   * Norte Strength (coach.norte@example.com), código NORTE001, plan starter (10):
--     clientes diego, elena y la propia coach de Iron Lab (coach y clienta a
--     la vez, D-048). fran está DADO DE BAJA (D-055).
--
-- Todos entran con la contraseña "password123". Solo existe en la base de
-- datos local: no es un secreto.
--
-- Idioma: al entrar, la app se pone en el idioma de la cuenta (D-058). Todos
-- están en inglés, que es lo que esperan los tests de extremo a extremo, salvo
-- carla, en español, para probar a mano que la app cambia sola al entrar.
--
-- Los negocios se crean con las mismas funciones que usará la app
-- (create_tenant, join_tenant_with_code, archive_client): así el seed también
-- las prueba.
-- =====================================================================

-- Usuarios. Supabase Auth necesita la fila de auth.users y su identidad de
-- email para poder entrar con contraseña. Los datos de la cuenta
-- (raw_user_meta_data) son los mismos que envía la app al registrarse: el
-- trigger on_auth_user_created crea el perfil con ellos, y los emails
-- salen en el idioma de cada uno (D-044).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'display_name', u.display_name, 'locale', u.locale, 'weight_unit', u.weight_unit,
    'terms_version', 'draft-2026-11'
  ),
  now(), now(),
  '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'coach.iron@example.com',  'Iris Hierro',     'en', 'lb'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'coach.norte@example.com', 'Nora Norte',      'en', 'kg'),
  ('20000000-0000-4000-8000-000000000001'::uuid, 'ana@example.com',         'Ana Ejemplo',     'en', 'kg'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'bruno@example.com',       'Bruno Prueba',    'en', 'lb'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'carla@example.com',       'Carla Demo',      'es', 'kg'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'diego@example.com',       'Diego Ficticio',  'en', 'kg'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'elena@example.com',       'Elena Inventada', 'en', 'kg'),
  ('20000000-0000-4000-8000-000000000006'::uuid, 'fran@example.com',        'Fran Ejemplo',    'en', 'kg')
) as u (id, email, display_name, locale, weight_unit);

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@example.com';

-- Negocios y clientes, actuando como cada usuario.
do $$
declare
  v_iron  uuid;
  v_norte uuid;
  v_user  uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001"}', true);
  v_iron := public.create_tenant('Iron Lab', 'draft-2026-11');
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002"}', true);
  v_norte := public.create_tenant('Norte Strength', 'draft-2026-11');

  -- La misma marca que los datos de prueba de los tests de la app.
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Iron Lab', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#DC2626', 'accent', '#F59E0B'), 'mode', 'dark'
  ) where id = v_iron;
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Norte Strength', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#0F766E', 'accent', '#B45309'), 'mode', 'light'
  ) where id = v_norte;

  -- Norte Strength tiene un plan con más plazas (el plan lo cambia el
  -- propietario a mano hasta la Fase 5, D-020).
  update public.tenants set plan = 'starter' where id = v_norte;

  -- Códigos fijos, para poder escribirlos a mano en local.
  update public.tenant_invites set code = 'IRONLAB1' where tenant_id = v_iron;
  update public.tenant_invites set code = 'NORTE001' where tenant_id = v_norte;

  -- Iron Lab: 3 clientes, el plan free lleno.
  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('IRONLAB1');
  end loop;

  -- Norte Strength: diego, elena, la coach de Iron Lab y fran.
  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000006'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('NORTE001');
  end loop;

  -- La coach de Norte da de baja a fran.
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002"}', true);
  perform public.archive_client(v_norte, '20000000-0000-4000-8000-000000000006');

  perform set_config('request.jwt.claims', '', true);
end
$$;


-- =====================================================================
-- Rutinas de ejemplo (PR 2.5b): las de docs/referencia/rutinas-de-ejemplo.md.
-- Iron Lab: "Casa + Gym" (semanal) y "Pecho / Espalda y Brazo / Pierna"
-- (ciclo de 8 días). Norte Strength: "Fuerza básica". Las tres, plantillas.
-- Se escriben directamente porque el seed se carga sin RLS; la app las
-- guardará con la función del PR 2.6.
-- =====================================================================

-- Ejercicios propios de Iron Lab: los de sus rutinas que no están en el
-- catálogo con ese mismo nombre.
insert into public.exercises (tenant_id, name, measurement, is_unilateral, muscle_group, equipment, created_by)
select t.id, x.name, x.measurement, x.is_unilateral, x.muscle_group, x.equipment,
       '10000000-0000-4000-8000-000000000001'
from public.tenants t,
(values
  ('Flexiones con mochila',                        'bodyweight_reps', false, 'chest',      'bodyweight'),
  ('Flexiones con pies en la cama',                'bodyweight_reps', false, 'chest',      'bodyweight'),
  ('Dominadas prono agarre abierto',               'bodyweight_reps', false, 'back',       'bodyweight'),
  ('Abdomen',                                      'bodyweight_reps', false, 'abs',        'bodyweight'),
  ('Curl martillo con mancuernas',                 'weight_reps',     false, 'biceps',     'dumbbells'),
  ('Remo Gironda agarre amplio',                   'weight_reps',     false, 'back',       'cable'),
  ('Jalón agarre estrecho/neutro (plano sagital)', 'weight_reps',     false, 'back',       'cable'),
  ('Aperturas',                                    'weight_reps',     false, 'chest',      'machine'),
  ('Extensión de tríceps en polea, codo pegado',   'weight_reps',     false, 'triceps',    'cable'),
  ('Curl femoral',                                 'weight_reps',     false, 'hamstrings', 'machine'),
  ('Hip thrust',                                   'weight_reps',     false, 'glutes',     'barbell'),
  ('Press horizontal en máquina',                  'weight_reps',     false, 'chest',      'machine'),
  ('Press inclinado',                              'weight_reps',     false, 'chest',      'machine'),
  ('Jalón dorsal plano frontal',                   'weight_reps',     false, 'back',       'cable'),
  ('Jalón dorsal plano sagital',                   'weight_reps',     false, 'back',       'cable'),
  ('Laterales en polea (hombro)',                  'weight_reps',     true,  'shoulders',  'cable'),
  ('Hombro posterior',                             'weight_reps',     false, 'shoulders',  'machine'),
  ('Curl banco Scott unilateral',                  'weight_reps',     true,  'biceps',     'dumbbells'),
  ('Martillo en polea',                            'weight_reps',     false, 'biceps',     'cable'),
  ('Elevaciones laterales',                        'weight_reps',     false, 'shoulders',  'dumbbells')
) as x (name, measurement, is_unilateral, muscle_group, equipment)
where t.name = 'Iron Lab';

-- Crea una plantilla con un solo bloque sin fecha de fin y devuelve el bloque.
create function pg_temp.seed_template(p_tenant text, p_name text, p_cycle_days int, p_coach uuid)
returns uuid language plpgsql as $fn$
declare
  v_tenant  uuid;
  v_program uuid;
  v_block   uuid;
begin
  select id into strict v_tenant from public.tenants where name = p_tenant;
  insert into public.programs (tenant_id, name, created_by)
  values (v_tenant, p_name, p_coach) returning id into v_program;
  insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
  values (v_tenant, v_program, 1, p_cycle_days) returning id into v_block;
  return v_block;
end
$fn$;

-- Añade un día al bloque. Sin ejercicios es un día de descanso. Cada
-- ejercicio va como 'Nombre|series' o 'Nombre|series|cantidad': la cantidad
-- son repeticiones fijas o, si el ejercicio se mide por tiempo, segundos.
-- Prescripción inventada (rutinas-de-ejemplo.md): 8 a 12 repeticiones, RIR 1
-- y 2 minutos de descanso; "Abdomen", 12 a 15 y 1 minuto.
create function pg_temp.seed_day(
  p_block uuid, p_day int, p_name text, p_subtitle text, p_place text, p_exercises text[]
) returns void language plpgsql as $fn$
declare
  v_block  public.program_blocks;
  v_day    uuid;
  v_item   uuid;
  v_parts  text[];
  v_ex     public.exercises;
  v_amount int;
  i        int;
begin
  select * into strict v_block from public.program_blocks where id = p_block;
  insert into public.program_days (tenant_id, program_id, block_id, day_number, kind, name, subtitle, place)
  values (v_block.tenant_id, v_block.program_id, p_block, p_day,
          case when p_exercises is null then 'rest' else 'training' end, p_name, p_subtitle, p_place)
  returning id into v_day;

  for i in 1 .. coalesce(array_length(p_exercises, 1), 0) loop
    v_parts := string_to_array(p_exercises[i], '|');
    -- "strict": si un nombre no existe, el seed falla y lo dice.
    select e.* into strict v_ex
    from public.exercises e
    left join public.exercise_library l on l.key = e.library_key
    where e.tenant_id = v_block.tenant_id and coalesce(e.name, l.name_es) = v_parts[1];
    v_amount := v_parts[3]::int;

    insert into public.program_day_exercises (tenant_id, program_id, day_id, position, exercise_id, rest_seconds)
    values (v_block.tenant_id, v_block.program_id, v_day, i, v_ex.id,
            case when v_parts[1] = 'Abdomen' then 60 else 120 end)
    returning id into v_item;

    insert into public.program_sets (tenant_id, program_id, day_exercise_id, position,
                                     reps_min, reps_max, duration_seconds, intensity_type, intensity_value)
    select v_block.tenant_id, v_block.program_id, v_item, n,
           case when v_ex.measurement = 'time' then null
                else coalesce(v_amount, case when v_parts[1] = 'Abdomen' then 12 else 8 end) end,
           case when v_ex.measurement = 'time' then null
                else coalesce(v_amount, case when v_parts[1] = 'Abdomen' then 15 else 12 end) end,
           case when v_ex.measurement = 'time' then v_amount end,
           case when v_ex.measurement = 'time' then null else 'rir' end,
           case when v_ex.measurement = 'time' then null else 1 end
    from generate_series(1, v_parts[2]::int) n;
  end loop;
end
$fn$;

do $$
declare
  v_coach_iron  constant uuid := '10000000-0000-4000-8000-000000000001';
  v_coach_norte constant uuid := '10000000-0000-4000-8000-000000000002';
  v_block uuid;
  v_arm_leg  text[] := array[
    'Press francés|2', 'Extensión de tríceps en polea|3', 'Curl banco Scott unilateral|3',
    'Martillo en polea|2', 'Elevaciones laterales|3', 'Hombro posterior|1',
    'Extensión de cuádriceps|3', 'Sentadilla péndulo|2', 'Curl femoral sentado|2'];
  v_basic    text[] := array[
    'Sentadilla con barra|3|5', 'Press de banca con barra|3|5', 'Remo con barra|3|8', 'Plancha|3|45'];
begin
  -- 1. "Casa + Gym": semanal. En un ciclo de 7 días el día 1 es lunes.
  v_block := pg_temp.seed_template('Iron Lab', 'Casa + Gym', 7, v_coach_iron);
  perform pg_temp.seed_day(v_block, 1, null, 'Empuje + dorsal + bíceps', 'Casa', array[
    'Flexiones con mochila|3', 'Flexiones con pies en la cama|3', 'Elevaciones laterales con mancuernas|3',
    'Flexiones esfinge|3', 'Dominadas prono agarre abierto|3', 'Curl martillo con mancuernas|2', 'Abdomen|3']);
  perform pg_temp.seed_day(v_block, 2, null, null, null, null);
  perform pg_temp.seed_day(v_block, 3, null, 'Tirón + pierna', 'Gym', array[
    'Remo Gironda agarre amplio|3', 'Jalón agarre estrecho/neutro (plano sagital)|2', 'Aperturas|3',
    'Extensión de tríceps en polea, codo pegado|3', 'Curl predicador en máquina|2',
    'Extensión de cuádriceps|2', 'Curl femoral|2', 'Hip thrust|2']);
  perform pg_temp.seed_day(v_block, 4, null, null, null, null);
  perform pg_temp.seed_day(v_block, 5, null, 'Empuje', 'Casa', array[
    'Flexiones con mochila|3', 'Flexiones con pies en la cama|3', 'Elevaciones laterales con mancuernas|4',
    'Flexiones esfinge|3', 'Abdomen|3']);
  perform pg_temp.seed_day(v_block, 6, null, 'Tirón + pierna', 'Gym', array[
    'Remo Gironda agarre amplio|3', 'Pec deck invertido|2', 'Jalón agarre estrecho/neutro (plano sagital)|2',
    'Curl predicador en máquina|3', 'Extensión de cuádriceps|2', 'Curl femoral|3', 'Hip thrust|3']);
  perform pg_temp.seed_day(v_block, 7, null, null, null, null);

  -- 2. "Pecho / Espalda y Brazo / Pierna": ciclo de 8 días.
  v_block := pg_temp.seed_template('Iron Lab', 'Pecho / Espalda y Brazo / Pierna', 8, v_coach_iron);
  perform pg_temp.seed_day(v_block, 1, 'Pecho / Espalda', null, 'Gym', array[
    'Press horizontal en máquina|3', 'Press inclinado|2', 'Aperturas en polea sentado|2', 'Remo en T|3',
    'Jalón dorsal plano frontal|2', 'Jalón dorsal plano sagital|2', 'Laterales en polea (hombro)|3',
    'Hombro posterior|1', 'Abdomen|3']);
  perform pg_temp.seed_day(v_block, 2, 'Brazo / Pierna 1', null, 'Gym', v_arm_leg);
  perform pg_temp.seed_day(v_block, 3, null, null, null, null);
  perform pg_temp.seed_day(v_block, 4, 'Espalda / Pecho', null, 'Gym', array[
    'Remo en T|3', 'Jalón dorsal plano frontal|2', 'Jalón dorsal plano sagital|2',
    'Press horizontal en máquina|2', 'Press inclinado|2', 'Aperturas en polea sentado|2',
    'Laterales en polea (hombro)|3', 'Hombro posterior|1', 'Abdomen|3']);
  perform pg_temp.seed_day(v_block, 5, 'Brazo / Pierna 2', null, 'Gym', v_arm_leg);
  perform pg_temp.seed_day(v_block, 6, null, null, null, null);
  perform pg_temp.seed_day(v_block, 7, null, null, null, null);
  perform pg_temp.seed_day(v_block, 8, null, null, null, null);

  -- 3. "Fuerza básica", de Norte Strength: lunes, miércoles y viernes iguales.
  v_block := pg_temp.seed_template('Norte Strength', 'Fuerza básica', 7, v_coach_norte);
  perform pg_temp.seed_day(v_block, 1, null, null, null, v_basic);
  perform pg_temp.seed_day(v_block, 2, null, null, null, null);
  perform pg_temp.seed_day(v_block, 3, null, null, null, v_basic);
  perform pg_temp.seed_day(v_block, 4, null, null, null, null);
  perform pg_temp.seed_day(v_block, 5, null, null, null, v_basic);
  perform pg_temp.seed_day(v_block, 6, null, null, null, null);
  perform pg_temp.seed_day(v_block, 7, null, null, null, null);
end
$$;

-- Lo que se sale de la prescripción por defecto, para que haya de todo.
-- "Remo Gironda agarre amplio", el miércoles: la primera serie, de 6 a 8 con
-- RIR 1; las otras dos, de 10 a 12 con RIR 0.
update public.program_sets s
set reps_min = case when s.position = 1 then 6 else 10 end,
    reps_max = case when s.position = 1 then 8 else 12 end,
    intensity_value = case when s.position = 1 then 1 else 0 end
from public.program_day_exercises de
join public.program_days d on d.id = de.day_id
join public.exercises e on e.id = de.exercise_id
where s.day_exercise_id = de.id and e.name = 'Remo Gironda agarre amplio' and d.day_number = 3;

-- "Extensión de cuádriceps", el miércoles: la última serie, al fallo.
update public.program_sets s
set intensity_type = 'failure', intensity_value = null
from public.program_day_exercises de
join public.program_days d on d.id = de.day_id
join public.programs p on p.id = de.program_id
join public.exercises e on e.id = de.exercise_id
where s.day_exercise_id = de.id and e.library_key = 'leg_extension'
  and p.name = 'Casa + Gym' and d.day_number = 3 and s.position = 2;

-- "Hip thrust": nota del coach. "Flexiones con mochila": 10 kg de lastre.
update public.program_day_exercises de
set note = 'Pausa de 1 segundo arriba'
from public.exercises e
where e.id = de.exercise_id and e.name = 'Hip thrust';

update public.program_sets s
set target_load_kg = 10
from public.program_day_exercises de
join public.exercises e on e.id = de.exercise_id
where s.day_exercise_id = de.id and e.name = 'Flexiones con mochila';


-- =====================================================================
-- Rutinas asignadas (PR 2.12a): cada cliente con su copia de una
-- plantilla. Las fechas, relativas al día en que se carga el seed: Ana
-- empezó hace 6 semanas, Bruno hace 3 ciclos de 8 días y Diego hace 5
-- semanas, para que tengan historial de entrenos (PR 3.3c).
-- Ana: "Casa + Gym" (calendario). Bruno: "Pecho / Espalda y Brazo /
-- Pierna" (calendario). Carla: ninguna. Diego: "Fuerza básica" en modo
-- lista. Elena: "Fuerza básica" como próxima, para dentro de 7 días.
-- Fran (dado de baja): "Fuerza básica", de antes de su baja.
-- Se copian con private.copy_program, sin pasar por assign_program: el
-- seed no actúa como ningún usuario y Fran ya está dado de baja.
-- =====================================================================
do $$
declare
  v_row record;
begin
  for v_row in
    select p.tenant_id, p.id as template_id, p.name, p.created_by, a.client_id, a.starts_on, a.mode
    from (values
      ('Casa + Gym',                       '20000000-0000-4000-8000-000000000001'::uuid, current_date - 42, 'calendar'),
      ('Pecho / Espalda y Brazo / Pierna', '20000000-0000-4000-8000-000000000002'::uuid, current_date - 24, 'calendar'),
      ('Fuerza básica',                    '20000000-0000-4000-8000-000000000004'::uuid, current_date - 35, 'list'),
      ('Fuerza básica',                    '20000000-0000-4000-8000-000000000005'::uuid, current_date + 7,  'calendar'),
      ('Fuerza básica',                    '20000000-0000-4000-8000-000000000006'::uuid, current_date - 60, 'calendar')
    ) as a (template_name, client_id, starts_on, mode)
    join public.programs p on p.name = a.template_name and p.client_id is null
  loop
    perform private.copy_program(
      v_row.tenant_id, v_row.template_id, v_row.name, v_row.client_id,
      v_row.starts_on, v_row.mode, v_row.created_by);
  end loop;
end
$$;


-- =====================================================================
-- Entrenos inventados (PR 3.3c): el historial de Ana, Bruno y Diego desde
-- que empezaron su rutina hasta ayer, con las tablas de los PR 3.2 y 3.3.
--   * Ana y Bruno (con calendario): hacen casi todos sus días de entreno;
--     uno de cada siete se lo saltan y queda en program_missed_days.
--   * Diego (modo lista): entrena tres veces por semana, sin días
--     faltados (en modo lista no existen, D-125).
--   * Cada vez que repiten un día suben 2,5 kg; la última vez, la primera
--     serie sube 5 kg más: un récord.
-- Pesos y repeticiones inventados, sin intención de realismo. Se escriben
-- directamente: el seed no actúa como ningún usuario.
-- =====================================================================

-- Un entreno cerrado del día p_day, el día p_date. p_round es cuántas veces
-- ha hecho ya ese día (para la progresión); p_record, si es la última.
create function pg_temp.seed_workout(
  p_program public.programs, p_day public.program_days, p_date date, p_round int, p_record boolean
) returns void language plpgsql as $fn$
declare
  v_workout uuid := gen_random_uuid();
  v_start   timestamptz := (p_date + time '18:00') at time zone 'utc';
  v_minute  int := 0;
  v_item    record;
  v_wex     uuid;
  v_n       int;
  v_side    text;
  v_kg      numeric;
  v_reps    boolean;
begin
  insert into public.workouts (id, tenant_id, client_id, program_id, block_id, program_day_id, day_number,
                               performed_on, started_at, last_changed_at, closed_at, close_reason)
  values (v_workout, p_program.tenant_id, p_program.client_id, p_program.id, p_day.block_id, p_day.id,
          p_day.day_number, p_date, v_start, v_start + interval '1 hour', v_start + interval '1 hour', 'manual');

  for v_item in
    select de.*, e.measurement, e.is_unilateral,
           (select jsonb_agg(to_jsonb(ps) - 'id' - 'tenant_id' - 'program_id' - 'day_exercise_id'
                             order by ps.position)
            from public.program_sets ps where ps.day_exercise_id = de.id) as sets
    from public.program_day_exercises de
    join public.exercises e on e.id = de.exercise_id
    where de.day_id = p_day.id order by de.position
  loop
    v_wex := gen_random_uuid();
    insert into public.workout_exercises (id, tenant_id, workout_id, position, exercise_id, program_day_exercise_id,
                                          superset_group, prescribed_sets, prescribed_rest_seconds, coach_note, changed_at)
    values (v_wex, p_program.tenant_id, v_workout, v_item.position, v_item.exercise_id, v_item.id,
            v_item.superset_group, coalesce(v_item.sets, '[]'), v_item.rest_seconds, v_item.note,
            v_start + make_interval(mins => v_minute));
    -- Un peso de partida distinto para cada ejercicio, de 20 a 60 kg.
    v_kg := 20 + (abs(hashtext(v_item.exercise_id::text)) % 9) * 5 + 2.5 * p_round;
    v_reps := v_item.measurement in ('weight_reps', 'bodyweight_reps');

    for v_n in 1 .. jsonb_array_length(coalesce(v_item.sets, '[]')) loop
      foreach v_side in array case when v_item.is_unilateral then array['right','left'] else array['none'] end loop
        v_minute := v_minute + 3;
        insert into public.workout_sets (id, tenant_id, workout_id, workout_exercise_id, set_number, side,
                                         weight_kg, reps, duration_seconds, distance_meters,
                                         intensity_type, intensity_value, recorded_at)
        values (gen_random_uuid(), p_program.tenant_id, v_workout, v_wex, v_n, v_side,
                case v_item.measurement
                  when 'weight_reps' then v_kg + case when p_record and v_n = 1 then 5 else 0 end
                  when 'bodyweight_reps' then 0 end,
                case when v_reps then 11 - v_n end,
                case when v_item.measurement = 'time' then 40 + 5 * p_round end,
                case when v_item.measurement = 'distance' then 400 end,
                case when v_reps then 'rir' end,
                case when v_reps then least(v_n, 2) end,
                v_start + make_interval(mins => v_minute));
      end loop;
    end loop;
  end loop;
end
$fn$;

do $$
declare
  v_program public.programs;
  v_day     public.program_days;
  v_cycle   int;
  v_date    date;
  v_count   int;
  v_round   int;
  v_k       int;
  v_days    int;
begin
  -- Ana y Bruno: con calendario. Su único bloque no tiene fin.
  for v_program in
    select * from public.programs where client_id in
      ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002')
  loop
    select cycle_days into strict v_cycle from public.program_blocks where program_id = v_program.id;
    v_count := 0;
    for v_date in select d::date from generate_series(v_program.starts_on, current_date - 1, interval '1 day') d loop
      select * into v_day from public.program_days
      where program_id = v_program.id and kind = 'training'
        and day_number = (v_date - v_program.starts_on) % v_cycle + 1;
      continue when not found;
      v_count := v_count + 1;
      if v_count % 7 = 3 then
        insert into public.program_missed_days (tenant_id, program_id, block_id, program_day_id, day_number, missed_on)
        values (v_program.tenant_id, v_program.id, v_day.block_id, v_day.id, v_day.day_number, v_date);
        continue;
      end if;
      select count(*) into v_round from public.workouts where program_day_id = v_day.id;
      perform pg_temp.seed_workout(v_program, v_day, v_date, v_round, v_date + v_cycle >= current_date);
    end loop;
  end loop;

  -- Diego: modo lista, sus días de entreno en orden, tres por semana.
  select * into strict v_program from public.programs where client_id = '20000000-0000-4000-8000-000000000004';
  select count(*) into v_days from public.program_days where program_id = v_program.id and kind = 'training';
  v_k := 0;
  loop
    v_date := v_program.starts_on + (v_k * 7) / 3;
    exit when v_date >= current_date;
    select * into strict v_day from public.program_days
    where program_id = v_program.id and kind = 'training'
    order by day_number offset v_k % v_days limit 1;
    select count(*) into v_round from public.workouts where program_day_id = v_day.id;
    perform pg_temp.seed_workout(v_program, v_day, v_date, v_round,
                                 v_program.starts_on + ((v_k + v_days) * 7) / 3 >= current_date);
    v_k := v_k + 1;
  end loop;
end
$$;

-- Datos de salud y ajustes (PR 3.3): Ana y Bruno dieron el consentimiento
-- (D-126); Diego, no, para probar la app sin él. Ana apunta su peso cada
-- semana, algunas medidas y una nota del día; Bruno, solo su peso. Ana
-- tiene el set-up de un ejercicio y Bruno cambia cómo funciona "Igual".
insert into public.health_consents (tenant_id, user_id, granted_at, text_version)
select tenant_id, client_id, starts_on, '2026-11-draft'
from public.programs
where client_id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');

insert into public.body_weights (tenant_id, user_id, measured_on, weight_kg)
select p.tenant_id, p.client_id, current_date - 7 * w,
       case when p.client_id = '20000000-0000-4000-8000-000000000001' then 62 + 0.3 * w else 88 - 0.2 * w end
from public.programs p, generate_series(0, 5) w
where p.client_id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');

insert into public.body_measurements (tenant_id, user_id, measured_on, kind, side, value_cm)
select p.tenant_id, p.client_id, current_date - 28 * ago, m.kind, m.side, m.cm + ago
from public.programs p,
     (values ('waist', null, 72.0), ('hips', null, 96.0), ('arm', 'right', 29.5), ('arm', 'left', 29.0))
       as m (kind, side, cm),
     generate_series(0, 1) ago
where p.client_id = '20000000-0000-4000-8000-000000000001';

update public.workout_exercises set day_note = 'Molestia en el hombro, bajé un poco el peso'
where id = (select e.id from public.workout_exercises e
            join public.workouts w on w.id = e.workout_id
            where w.client_id = '20000000-0000-4000-8000-000000000001'
            order by w.performed_on desc, e.position limit 1);

insert into public.client_exercise_setups (tenant_id, client_id, exercise_id, setup)
select de.tenant_id, p.client_id, de.exercise_id, 'Asiento 3 · Agarre en la línea 2'
from public.programs p
join public.program_day_exercises de on de.program_id = p.id
where p.client_id = '20000000-0000-4000-8000-000000000001'
order by de.position limit 1;

update public.profiles set same_button = 'previous_then_today'
where user_id = '20000000-0000-4000-8000-000000000002';
