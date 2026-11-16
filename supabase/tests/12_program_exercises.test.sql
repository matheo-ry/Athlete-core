-- =====================================================================
-- Ejercicios de cada día y series (PR 2.5b; DECISIONES D-072, D-076, D-086).
-- Adapta a estas tablas los casos 15, 17, 18 y 19 de
-- docs/referencia/pruebas-aislamiento.sql, y añade la lectura de
-- ejercicios por el cliente y la regla de D-072.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A.
-- Las filas de prueba se ponen sin RLS ("reset role"): desde la app nadie
-- escribe en estas tablas.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
-- En staging, el usuario temporal de la CLI no busca en "extensions", donde
-- vive pgTAP. Es la misma ruta de búsqueda que ya hay en local.
set local search_path to "$user", public, extensions;

select plan(46);

create function pg_temp.affected_rows(p_sql text) returns int
language plpgsql as $fn$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end
$fn$;
grant execute on function pg_temp.affected_rows(text) to authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
reset role;

-- ----- Ejercicios propios: dos en A y uno en B -----
create function pg_temp.add_exercise(p_key text, p_tenant uuid, p_name text) returns void
language plpgsql as $fn$
declare v_id uuid;
begin
  insert into public.exercises (tenant_id, name, measurement)
  values (p_tenant, p_name, 'weight_reps') returning id into v_id;
  perform set_config('t.ex_' || p_key, v_id::text, true);
end
$fn$;
select pg_temp.add_exercise('a1', current_setting('t.ta')::uuid, 'Remo de prueba');
select pg_temp.add_exercise('a2', current_setting('t.ta')::uuid, 'Press de prueba');
select pg_temp.add_exercise('b', current_setting('t.tb')::uuid, 'Curl de prueba');

-- ----- Rutinas: en A, una plantilla (con a2), la de C (con a1) y la de D (con a2) -----
-- Cada una con un bloque, un día, un ejercicio y dos series.
create function pg_temp.add_program(p_key text, p_tenant uuid, p_client uuid, p_exercise uuid)
returns void language plpgsql as $fn$
declare
  v_program uuid;
  v_block   uuid;
  v_day     uuid;
  v_item    uuid;
begin
  insert into public.programs (tenant_id, name, client_id, starts_on)
  values (p_tenant, 'Rutina ' || p_key, p_client, case when p_client is not null then current_date end)
  returning id into v_program;
  insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
  values (p_tenant, v_program, 1, 1) returning id into v_block;
  insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
  values (p_tenant, v_program, v_block, 1, 'training') returning id into v_day;
  insert into public.program_day_exercises (tenant_id, program_id, day_id, position, exercise_id, rest_seconds)
  values (p_tenant, v_program, v_day, 1, p_exercise, 120) returning id into v_item;
  insert into public.program_sets (tenant_id, program_id, day_exercise_id, position, reps_min, reps_max,
                                   intensity_type, intensity_value)
  values (p_tenant, v_program, v_item, 1, 8, 12, 'rir', 1),
         (p_tenant, v_program, v_item, 2, 8, 12, 'rir', 1);
  perform set_config('t.p_' || p_key, v_program::text, true);
  perform set_config('t.day_' || p_key, v_day::text, true);
  perform set_config('t.item_' || p_key, v_item::text, true);
end
$fn$;
select pg_temp.add_program('tpl', current_setting('t.ta')::uuid, null, current_setting('t.ex_a2')::uuid);
select pg_temp.add_program('c', current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c',
                           current_setting('t.ex_a1')::uuid);
select pg_temp.add_program('d', current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000d',
                           current_setting('t.ex_a2')::uuid);

-- ----- Sin sesión no se lee nada -----
set local role anon;
select throws_ok('select 1 from public.program_day_exercises', '42501', null,
  'sin sesión no se leen los ejercicios de un día');
select throws_ok('select 1 from public.program_sets', '42501', null, 'sin sesión no se leen las series');
reset role;

-- ----- Caso 15: el coach lee lo de su negocio y nadie escribe directamente -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.program_day_exercises), 3, '15a: A ve los ejercicios de sus 3 rutinas');
select is((select count(*)::int from public.program_sets), 6, '15b: y sus 6 series');
select throws_ok(
  $$ insert into public.program_day_exercises (tenant_id, program_id, day_id, position, exercise_id)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.day_tpl')::uuid, 2, current_setting('t.ex_a1')::uuid) $$,
  '42501', null, '15c: ni el coach añade un ejercicio a un día directamente');
select throws_ok($$ update public.program_day_exercises set note = 'Cambiada' $$, '42501', null,
  '15d: nadie cambia un ejercicio de un día directamente');
select throws_ok('delete from public.program_day_exercises', '42501', null,
  '15e: nadie lo borra directamente');
select throws_ok(
  $$ insert into public.program_sets (tenant_id, program_id, day_exercise_id, position)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.item_tpl')::uuid, 3) $$,
  '42501', null, '15f: nadie añade una serie directamente');
select throws_ok($$ update public.program_sets set reps_max = 15 $$, '42501', null,
  '15g: nadie cambia una serie directamente');
select throws_ok('delete from public.program_sets', '42501', null, '15h: nadie borra una serie directamente');

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select is(
  (select count(*)::int from public.program_day_exercises) + (select count(*)::int from public.program_sets),
  0, '15i: B no ve nada de las rutinas de A');

-- ----- Casos 18 y 19: el cliente lee el contenido de su rutina y de ninguna otra -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is(
  (select array_agg(program_id) from public.program_day_exercises),
  array[current_setting('t.p_c')::uuid], '18a: C lee los ejercicios de su rutina, y solo esos');
select is((select count(*)::int from public.program_sets), 2, '18b: y sus 2 series');
select is(
  (select count(*)::int from public.program_sets where program_id <> current_setting('t.p_c')::uuid),
  0, '19: C no ve las series de D ni las de la plantilla');
select throws_ok($$ update public.program_sets set reps_max = 15 $$, '42501', null,
  '18c: un cliente no cambia sus series');
select throws_ok($$ update public.program_day_exercises set note = 'Mía' $$, '42501', null,
  '18d: ni los ejercicios de sus días');

-- ----- El cliente lee los ejercicios de su rutina y ningún otro -----
select is((select array_agg(name) from public.exercises), array['Remo de prueba'],
  'ejercicios: C lee el de su rutina y ningún otro del negocio');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Del cliente' $$),
  0, 'ejercicios: pero no puede cambiarlo');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select is((select array_agg(name) from public.exercises), array['Press de prueba'],
  'ejercicios: D lee el de la suya');

-- ----- Un cliente dado de baja no lee nada; al reactivarlo, vuelve -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is(
  (select count(*)::int from public.program_day_exercises) + (select count(*)::int from public.program_sets)
    + (select count(*)::int from public.exercises),
  0, 'baja: C no lee ejercicios, ni series, ni los ejercicios del negocio');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select public.reactivate_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.program_sets), 2, 'baja: al reactivarlo, vuelve a leer sus series');

-- ----- La regla de D-072: un ejercicio que está en una rutina no cambia de medida -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select throws_ok(
  $$ update public.exercises set measurement = 'time' where id = current_setting('t.ex_a1')::uuid $$,
  'P0001', 'exercise_in_use', 'D-072: no se cambia la forma de medir de un ejercicio que está en una rutina');
select throws_ok(
  $$ update public.exercises set is_unilateral = true where id = current_setting('t.ex_a1')::uuid $$,
  'P0001', 'exercise_in_use', 'D-072: ni si es unilateral');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Remo retocado', muscle_group = 'back'
     where id = current_setting('t.ex_a1')::uuid $$),
  1, 'D-072: lo demás sí se puede cambiar');
select is(
  pg_temp.affected_rows($$ update public.exercises set measurement = 'time', is_unilateral = true
     where library_key = 'plank' $$),
  1, 'D-072: uno que no está en ninguna rutina cambia sin problema');
reset role;

-- ----- Caso 17: la clave compuesta impide mezclar negocios y rutinas -----
select throws_ok(
  $$ insert into public.program_day_exercises (tenant_id, program_id, day_id, position, exercise_id)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.day_tpl')::uuid, 2, current_setting('t.ex_b')::uuid) $$,
  '23503', null, '17a: una rutina de A no puede usar un ejercicio de B');
select throws_ok(
  $$ insert into public.program_day_exercises (tenant_id, program_id, day_id, position, exercise_id)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.day_c')::uuid, 2, current_setting('t.ex_a1')::uuid) $$,
  '23503', null, '17b: un ejercicio no puede colgar de un día de otra rutina');
select throws_ok(
  $$ insert into public.program_sets (tenant_id, program_id, day_exercise_id, position)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.item_c')::uuid, 3) $$,
  '23503', null, '17c: ni una serie, de un ejercicio de otra rutina');
select throws_ok(
  $$ delete from public.exercises where id = current_setting('t.ex_a1')::uuid $$,
  '23503', null, '17d: un ejercicio que está en una rutina no se puede borrar ni saltándose el RLS');

-- ----- Topes y límites de cada dato (D-076 y D-086) -----
select throws_ok(
  $$ update public.program_day_exercises set position = 31 where id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'D-086: un día no pasa de 30 ejercicios');
select throws_ok(
  $$ update public.program_day_exercises set rest_seconds = 3601 where id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'el descanso no pasa de una hora');
select throws_ok(
  $$ update public.program_day_exercises set note = repeat('a', 501) where id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'D-076: la nota no pasa de 500 caracteres');
select throws_ok(
  $$ insert into public.program_sets (tenant_id, program_id, day_exercise_id, position)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl')::uuid,
             current_setting('t.item_tpl')::uuid, 11) $$,
  '23514', null, 'D-086: un ejercicio no pasa de 10 series');
select throws_ok(
  $$ update public.program_sets set reps_min = 12, reps_max = 8
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'las repeticiones mínimas no superan a las máximas');
select throws_ok(
  $$ update public.program_sets set reps_max = null
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'las repeticiones van con mínima y máxima, o sin ninguna');
select throws_ok(
  $$ update public.program_sets set duration_seconds = 45
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'una serie lleva repeticiones, tiempo o distancia: solo una de las tres');
select lives_ok(
  $$ update public.program_sets set reps_min = null, reps_max = null, distance_meters = 400,
            intensity_type = 'rpe', intensity_value = 7.5, target_load_kg = 22.5
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  'D-076: distancia, RPE con medio punto y carga con decimales valen');
select throws_ok(
  $$ update public.program_sets set intensity_value = 0.5
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'D-076: el RPE va de 1 a 10');
select throws_ok(
  $$ update public.program_sets set intensity_type = 'rir', intensity_value = 2.5
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'D-076: el RIR no admite medios');
select throws_ok(
  $$ update public.program_sets set intensity_type = 'failure', intensity_value = 1
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'D-076: "al fallo" no lleva número');
select throws_ok(
  $$ update public.program_sets set intensity_type = null
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'sin tipo de intensidad no hay número');
select lives_ok(
  $$ update public.program_sets set intensity_type = 'failure', intensity_value = null
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  'D-076: "al fallo" vale');
select throws_ok(
  $$ update public.program_sets set target_load_kg = 1000.5
     where day_exercise_id = current_setting('t.item_tpl')::uuid $$,
  '23514', null, 'la carga objetivo no pasa de 1.000 kg');
select throws_ok(
  $$ do $d$ begin
       update public.program_sets set position = 1
       where day_exercise_id = current_setting('t.item_tpl')::uuid;
       set constraints all immediate;
     end $d$ $$,
  '23505', null, 'un ejercicio no tiene dos series en la misma posición');

-- ----- Borrar una rutina se lleva todo su contenido -----
delete from public.programs where id = current_setting('t.p_d')::uuid;
select is(
  (select count(*)::int from public.program_sets where program_id = current_setting('t.p_d')::uuid)
    + (select count(*)::int from public.program_day_exercises where program_id = current_setting('t.p_d')::uuid),
  0, 'al borrar una rutina se borran sus ejercicios y sus series');
select is((select count(*)::int from public.exercises where id = current_setting('t.ex_a2')::uuid), 1,
  'pero no el ejercicio del negocio');

select * from finish();
rollback;
