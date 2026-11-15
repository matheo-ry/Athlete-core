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
