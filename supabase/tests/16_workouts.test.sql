-- =====================================================================
-- Entrenos (PR 3.2a; DECISIONES D-118, D-119, D-124 y D-138): las tablas
-- workouts, workout_exercises y workout_sets, sync_workout y
-- discard_workout. Aislamiento (casos 16 a 18) y las reglas de subir.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A.
-- =====================================================================
begin;
-- En staging, el usuario temporal de la CLI (cli_login_postgres) es miembro
-- de postgres pero no asume el rol automáticamente ni tiene permisos sobre
-- "extensions" ni "auth". Asumimos postgres y concedemos uso de "extensions"
-- a public para que pgTAP siga disponible tras cualquier "reset role;".
set local role postgres;
grant usage on schema extensions to public;
create extension if not exists pgtap with schema extensions;
set local search_path to "$user", public, extensions;

select plan(36);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

-- Una plantilla semanal: el lunes, sentadilla con 3 series; el resto, descanso.
create function pg_temp.template(p_exercise uuid) returns jsonb language sql as $fn$
  select jsonb_build_object('name', 'Plantilla A', 'blocks', jsonb_build_array(
    jsonb_build_object('cycle_days', 7, 'laps', null, 'days',
      (select jsonb_agg(jsonb_build_object(
         'day_number', n, 'kind', case when n = 1 then 'training' else 'rest' end,
         'exercises', case when n = 1 then jsonb_build_array(jsonb_build_object(
           'exercise_id', p_exercise, 'rest_seconds', 120, 'sets',
           (select jsonb_agg(jsonb_build_object('reps_min', 8, 'reps_max', 12))
            from generate_series(1, 3)))) else '[]'::jsonb end) order by n)
       from generate_series(1, 7) n))))
$fn$;
-- Una serie de sentadilla, apuntada tantos minutos después de empezar.
create function pg_temp.s(p_id int, p_number int, p_weight numeric, p_minutes int,
                          p_done boolean default true) returns jsonb language sql as $fn$
  select jsonb_build_object('id', '30000000-0000-4000-8000-' || lpad(p_id::text, 12, '0'),
    'set_number', p_number, 'side', 'none', 'weight_kg', p_weight, 'reps', 8,
    'intensity_type', 'rir', 'intensity_value', 2, 'is_done', p_done,
    'recorded_at', current_setting('t.t0')::timestamptz + make_interval(mins => p_minutes))
$fn$;
-- El entreno p_workout del lunes de C, con esas series y lo que se añada.
create function pg_temp.w(p_workout int, p_sets jsonb, p_extra jsonb default '{}')
returns jsonb language sql as $fn$
  select jsonb_build_object(
    'id', '10000000-0000-4000-8000-' || lpad(p_workout::text, 12, '0'),
    'program_id', current_setting('t.p'), 'block_id', current_setting('t.blk'),
    'program_day_id', current_setting('t.day'), 'day_number', 1,
    'performed_on', current_setting('t.today'), 'started_at', current_setting('t.t0'),
    'last_changed_at', coalesce((select max((s ->> 'recorded_at')::timestamptz)
                                 from jsonb_array_elements(p_sets) s), current_setting('t.t0')::timestamptz),
    'device_id', 'phone-a', 'device_since', current_setting('t.t0'),
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', '20000000-0000-4000-8000-' || lpad(p_workout::text, 12, '0'), 'position', 1,
      'exercise_id', current_setting('t.ex'), 'program_day_exercise_id', current_setting('t.pde'),
      'prescribed_sets', '[{"reps_min":8,"reps_max":12}]'::jsonb, 'prescribed_rest_seconds', 120,
      'changed_at', current_setting('t.t0'), 'sets', p_sets))) || p_extra
$fn$;
create function pg_temp.sync(p_payload jsonb) returns void language sql as $fn$
  select public.sync_workout(current_setting('t.ta')::uuid, p_payload)
$fn$;
-- Cuántos entrenos, ejercicios y series ve quien llama.
create function pg_temp.seen() returns int[] language sql as $fn$
  select array[(select count(*)::int from public.workouts),
               (select count(*)::int from public.workout_exercises),
               (select count(*)::int from public.workout_sets)]
$fn$;
create function pg_temp.set1() returns public.workout_sets language sql as $fn$
  select * from public.workout_sets
  where workout_exercise_id = '20000000-0000-4000-8000-000000000001' and set_number = 1
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.t0', (now() - interval '1 hour')::text, true);
select set_config('t.today', ((now() - interval '1 hour') at time zone 'utc')::date::text, true);
select set_config('t.w1', '10000000-0000-4000-8000-000000000001', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);
select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

-- ----- A y B crean su negocio; C y D se unen a A; C recibe una rutina -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.ex', (select id from public.exercises where library_key = 'back_squat')::text, true);
select set_config('t.code_a',
  (select code from public.tenant_invites where is_active and tenant_id = current_setting('t.ta')::uuid), true);
select set_config('t.tpl', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template(current_setting('t.ex')::uuid)) ->> 'id', true);
select set_config('request.jwt.claims', current_setting('t.c'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.d'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.p', public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array['00000000-0000-4000-8000-00000000000c'::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) -> 0 ->> 'program_id', true);
select set_config('t.blk', (select id from public.program_blocks where program_id = current_setting('t.p')::uuid)::text, true);
select set_config('t.day', (select id from public.program_days
  where program_id = current_setting('t.p')::uuid and day_number = 1)::text, true);
select set_config('t.pde', (select id from public.program_day_exercises
  where program_id = current_setting('t.p')::uuid)::text, true);

-- ===== Subir =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select lives_ok($$ select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 40, 5), pg_temp.s(2, 2, 40, 6)))) $$,
  'el cliente sube un entreno con sus series');
select is(pg_temp.seen(), array[1, 1, 2], 'el cliente ve su entreno, su ejercicio y sus 2 series');
select lives_ok($$ select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 40, 5), pg_temp.s(2, 2, 40, 6)))) $$,
  'subir otra vez lo mismo no falla');
select is(pg_temp.seen(), array[1, 1, 2], 'D-118: subir dos veces lo mismo no duplica nada');
select is((select (block_id, program_day_id, day_number)::text from public.workouts),
  (select (current_setting('t.blk'), current_setting('t.day'), 1)::text), 'el entreno guarda su bloque y su día de la rutina');

select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 50, 20))));
select is((pg_temp.set1()).weight_kg, 50.00, 'D-124: en una serie gana el cambio más reciente');
select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 10, 10))));
select is((pg_temp.set1()).weight_kg, 50.00, 'D-124: un cambio más viejo, subido después, no pisa al nuevo');
-- Otro móvil apuntó la misma serie con otro identificador.
select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(9, 1, 55, 30))));
select is((select array[count(*)::int, max(weight_kg)::int] from public.workout_sets where set_number = 1), array[1, 55],
  'D-124: la misma serie desde dos móviles queda en una sola fila, con el último cambio');
select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(2, 2, 40, 31, false))));
select is((select count(*)::int from public.workout_sets where is_done), 1,
  'D-120: desmarcar una serie la deja sin contar, sin borrarla');

select pg_temp.sync(pg_temp.w(1, '[]', jsonb_build_object('device_id', 'phone-b',
  'device_since', current_setting('t.t0')::timestamptz + interval '40 minutes')));
select pg_temp.sync(pg_temp.w(1, '[]'));
select is((select open_device_id from public.workouts), 'phone-b',
  'D-124: "Seguir aquí" pasa el entreno al otro móvil, y lo que suba tarde el primero no se lo quita');

-- ===== Cerrar y corregir =====
select pg_temp.sync(pg_temp.w(1, '[]', jsonb_build_object('closed_at',
  current_setting('t.t0')::timestamptz + interval '45 minutes', 'close_reason', 'manual')));
select is((select (close_reason, open_device_id is null, edited_at is null)::text from public.workouts),
  '(manual,t,t)', 'el entreno se cierra, sin móvil abierto y sin "Editado"');
select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 40, 5), pg_temp.s(2, 2, 40, 6))));
select is((select (closed_at is not null and edited_at is null) from public.workouts), true,
  'subir otra vez algo ya subido no reabre el entreno ni lo marca "Editado"');
select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 60, 50))));
select is((select (edited_at is not null) from public.workouts), true, 'D-124: corregir un entreno cerrado lo marca "Editado"');
select is((pg_temp.set1()).weight_kg, 60.00, 'la corrección se guarda');

set local role postgres;
update public.workouts set started_at = now() - interval '9 days', closed_at = now() - interval '8 days'
where id = current_setting('t.w1')::uuid;
set local role authenticated;
select lives_ok($$ select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 60, 50)))) $$,
  'pasados 7 días, subir otra vez lo mismo no falla');
select throws_ok($$ select pg_temp.sync(pg_temp.w(1, jsonb_build_array(pg_temp.s(1, 1, 70, 55)))) $$,
  'P0001', 'workout_locked', 'D-124: pasados 7 días desde que se cerró, ya no se corrige');

-- ===== Lo que se rechaza =====
select throws_ok($$ select pg_temp.sync(pg_temp.w(3, jsonb_build_array(pg_temp.s(31, 1, 40, 5) || '{"side":"left"}'))) $$,
  'P0001', 'invalid_side', 'D-121: un ejercicio que no es unilateral no lleva lado');
select throws_ok($$ select pg_temp.sync(pg_temp.w(3, '[]', '{"started_at":"2099-01-01T00:00:00Z"}')) $$,
  'P0001', 'invalid_workout', 'una hora muy por delante de la del servidor no vale');
select throws_ok($$ insert into public.workouts (id, tenant_id, client_id, day_number, performed_on, started_at, last_changed_at)
  values (gen_random_uuid(), current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c', 1, current_date, now(), now()) $$,
  '42501', null, 'el cliente no escribe directamente: solo con sync_workout');
select throws_ok($$ delete from public.workout_sets $$, '42501', null, 'el cliente no borra series directamente');

select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(pg_temp.seen(), array[0, 0, 0], 'caso 18: un cliente no ve los entrenos de otro cliente del mismo coach');
select throws_ok($$ select pg_temp.sync(pg_temp.w(1, '[]')) $$, 'P0001', 'not_allowed',
  'un cliente no sube nada sobre el entreno de otro');
select throws_ok($$ select pg_temp.sync(pg_temp.w(4, '[]')) $$, 'P0001', 'program_not_found',
  'un cliente no sube un entreno de una rutina que no es suya');

select set_config('request.jwt.claims', current_setting('t.a'), true);
select is(pg_temp.seen(), array[1, 1, 2], 'el coach ve los entrenos de sus clientes');
select throws_ok($$ select pg_temp.sync(pg_temp.w(5, '[]')) $$, 'P0001', 'not_allowed', 'D-124: el coach no sube entrenos');
select throws_ok($$ update public.workouts set day_number = 2 $$, '42501', null, 'el coach no cambia entrenos directamente');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select is(pg_temp.seen(), array[0, 0, 0], 'caso 16: un coach no ve los entrenos de otro negocio');
set local role anon;
select throws_ok($$ select count(*) from public.workouts $$, '42501', null, 'sin sesión no se ve ningún entreno');
set local role authenticated;

-- ===== Descartar =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok($$ select public.discard_workout(current_setting('t.ta')::uuid, current_setting('t.w1')::uuid) $$,
  'P0001', 'workout_closed', 'un entreno cerrado ya es historial: no se descarta');
select pg_temp.sync(pg_temp.w(2, jsonb_build_array(pg_temp.s(21, 1, 40, 5))));
select set_config('request.jwt.claims', current_setting('t.d'), true);
select throws_ok($$ select public.discard_workout(current_setting('t.ta')::uuid, '10000000-0000-4000-8000-000000000002') $$,
  'P0001', 'not_allowed', 'un cliente no descarta el entreno de otro');
select set_config('request.jwt.claims', current_setting('t.c'), true);
select public.discard_workout(current_setting('t.ta')::uuid, '10000000-0000-4000-8000-000000000002');
select is(pg_temp.seen(), array[1, 1, 2], 'D-119: descartar borra el entreno abierto con sus ejercicios y series');
select lives_ok($$ select public.discard_workout(current_setting('t.ta')::uuid, '10000000-0000-4000-8000-000000000002') $$,
  'descartar otra vez, o algo que nunca se subió, no falla');

-- ===== El coach quita el ejercicio de la rutina; el historial se queda =====
set local role postgres;
delete from public.program_day_exercises where exercise_id = current_setting('t.ex')::uuid;
set local role authenticated;
select is((select count(*)::int from public.workout_exercises where program_day_exercise_id is null), 1,
  'D-087: si el coach quita el ejercicio de la rutina, el entreno se queda con su copia');
select set_config('request.jwt.claims', current_setting('t.a'), true);
select throws_ok($$ update public.exercises set measurement = 'time' where id = current_setting('t.ex')::uuid $$,
  'P0001', 'exercise_in_use', 'D-072: no cambia la forma de medir de un ejercicio con series apuntadas');

-- ===== Cliente dado de baja =====
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok($$ select pg_temp.sync(pg_temp.w(6, '[]')) $$, 'P0001', 'not_allowed',
  'D-118: un cliente dado de baja no sube entrenos');
select is(pg_temp.seen(), array[0, 0, 0], 'un cliente dado de baja no lee sus entrenos');

set local role postgres;
select * from finish();
rollback;
