-- =====================================================================
-- Ejercicios (PR 2.1): el catálogo de la plataforma y los ejercicios de
-- cada negocio (DECISIONES D-071 a D-073 y D-086).
-- Adapta a la tabla exercises los casos 15, 18 (la mitad: crear) y 28 de
-- docs/referencia/pruebas-aislamiento.sql.
--
-- Usuarios inventados: A y B son coaches; C es cliente de A.
-- Este test usa un catálogo propio, de una sola fila, para que sus cuentas
-- no dependan de los 120 ejercicios reales (esos los comprueba el test 10):
-- vacía el catálogo y pone su fila antes de crear los negocios.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
-- En staging, el usuario temporal de la CLI no busca en "extensions", donde
-- vive pgTAP. Es la misma ruta de búsqueda que ya hay en local.
set local search_path to "$user", public, extensions;

select plan(41);

-- Cuántas filas cambia una sentencia con el rol y el usuario del momento.
-- Las políticas de UPDATE ocultan las filas ajenas: 0 filas = bloqueado.
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
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test');

-- Dentro de la transacción del test: al terminar se deshace.
-- Primero las rutinas del seed: un ejercicio que está en una rutina no se
-- puede borrar (PR 2.5b).
delete from public.programs;
delete from public.exercises;
delete from public.exercise_library;
insert into public.exercise_library
  (key, name_en, name_es, muscle_group, equipment, measurement, is_unilateral)
values
  ('test_split_squat', 'Test split squat', 'Zancada de prueba', 'quads', 'dumbbells', 'weight_reps', true);

-- ----- Sin sesión no se lee nada -----
set local role anon;
select throws_ok('select 1 from public.exercise_library', '42501', null,
  'sin sesión no se lee el catálogo');
select throws_ok('select 1 from public.exercises', '42501', null,
  'sin sesión no se leen los ejercicios');
reset role;

-- ----- A y B crean su negocio; C se une a A -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));

-- ----- Un negocio nuevo recibe la copia del catálogo -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.exercises), 1,
  'copia: un negocio nuevo recibe un ejercicio por cada fila del catálogo');
select is(
  (select row(tenant_id, library_key, name, measurement, is_unilateral, muscle_group, equipment,
              created_by, archived_at)::text
   from public.exercises),
  row(current_setting('t.ta')::uuid, 'test_split_squat', null::text, 'weight_reps', true, 'quads',
      'dumbbells', null::uuid, null::timestamptz)::text,
  'copia: lleva los datos del catálogo, sin nombre propio (se lee del catálogo) y sin autor'
);

-- ----- El catálogo se lee pero no se escribe -----
select is((select count(*)::int from public.exercise_library), 1, 'catálogo: el coach lo lee');
select throws_ok(
  $$ insert into public.exercise_library (key, name_en, name_es, muscle_group, equipment, measurement)
     values ('hack', 'Hack', 'Hack', 'quads', 'machine', 'weight_reps') $$,
  '42501', null, 'catálogo: nadie añade filas');
select throws_ok($$ update public.exercise_library set name_en = 'Hack' $$, '42501', null,
  'catálogo: nadie cambia filas');
select throws_ok('delete from public.exercise_library', '42501', null,
  'catálogo: nadie borra filas');

-- ----- El coach crea y edita los ejercicios de su negocio -----
select lives_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'Flexiones con mochila', 'bodyweight_reps', auth.uid()) $$,
  'el coach crea un ejercicio en su negocio');
select set_config('t.ex_a', (select id::text from public.exercises where name = 'Flexiones con mochila'), true);
select is(
  pg_temp.affected_rows($$ update public.exercises
     set muscle_group = 'chest', equipment = 'bodyweight', instructions = 'Espalda recta.',
         video_url = 'https://example.test/video'
     where id = current_setting('t.ex_a')::uuid $$),
  1, 'el coach edita un ejercicio de su negocio');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Zancada búlgara'
     where library_key = 'test_split_squat' $$),
  1, 'el coach cambia el nombre de un ejercicio que viene del catálogo');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = null
     where library_key = 'test_split_squat' $$),
  1, 'y lo restaura: el nombre vuelve a quedar vacío');

-- ----- Lo que el coach no puede tocar -----
select throws_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'De otro', 'time', '00000000-0000-4000-8000-00000000000b') $$,
  '42501', null, 'el coach no puede crear un ejercicio a nombre de otro usuario');
select throws_ok(
  $$ insert into public.exercises (tenant_id, library_key, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'test_split_squat', 'time', auth.uid()) $$,
  '42501', null, 'el coach no puede crear ejercicios "del catálogo": solo llegan con la copia');
select throws_ok(
  $$ update public.exercises set tenant_id = current_setting('t.tb')::uuid $$,
  '42501', null, 'el coach no puede mover un ejercicio a otro negocio');
select throws_ok(
  $$ delete from public.exercises where id = current_setting('t.ex_a')::uuid $$,
  '42501', null, 'D-073: el coach no puede borrar un ejercicio');

-- ----- Listas cerradas y límites de cada dato (D-072) -----
select throws_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'Raro', 'calories', auth.uid()) $$,
  '23514', null, 'D-072: una forma de medir fuera de la lista se rechaza');
select throws_ok(
  $$ update public.exercises set muscle_group = 'neck' where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'D-072: un grupo muscular fuera de la lista se rechaza');
select throws_ok(
  $$ update public.exercises set equipment = 'sandbag' where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'D-072: un material fuera de la lista se rechaza');
select throws_ok(
  $$ update public.exercises set name = repeat('a', 81) where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'el nombre no pasa de 80 caracteres');
select throws_ok(
  $$ update public.exercises set name = '   ' where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'el nombre no puede ser solo espacios');
select throws_ok(
  $$ update public.exercises set name = null where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'un ejercicio propio no puede quedarse sin nombre');
select throws_ok(
  $$ update public.exercises set instructions = repeat('a', 2001) where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'las instrucciones no pasan de 2.000 caracteres');
select throws_ok(
  $$ update public.exercises set video_url = 'http://example.test/video' where id = current_setting('t.ex_a')::uuid $$,
  '23514', null, 'D-074: el enlace de vídeo solo admite https://');

-- ----- Caso 28: updated_at -----
-- Dentro de una transacción now() no avanza: se envejece la fila a mano.
reset role;
update public.exercises
set created_at = now() - interval '1 day', updated_at = now() - interval '1 day'
where id = current_setting('t.ex_a')::uuid;
-- El trigger habrá puesto updated_at = now(): se vuelve a envejecer sin él.
alter table public.exercises disable trigger exercises_set_updated_at;
update public.exercises set updated_at = created_at where id = current_setting('t.ex_a')::uuid;
alter table public.exercises enable trigger exercises_set_updated_at;
set local role authenticated;
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Flexiones lastradas'
     where id = current_setting('t.ex_a')::uuid $$),
  1, '28a: el coach cambia el nombre');
select ok(
  (select updated_at > created_at and updated_at = now() from public.exercises
   where id = current_setting('t.ex_a')::uuid),
  '28b: updated_at cambia solo al editar');

-- ----- Caso 15: un coach no toca ni ve los ejercicios de otro negocio -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.exercises), 1, '15a: B solo ve los ejercicios de su negocio');
select is(
  (select count(*)::int from public.exercises where tenant_id = current_setting('t.ta')::uuid),
  0, '15b: B no ve los ejercicios de A');
select throws_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'Intruso', 'time', auth.uid()) $$,
  '42501', null, '15c: B no puede crear un ejercicio en el negocio de A');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Intruso'
     where tenant_id = current_setting('t.ta')::uuid $$),
  0, '15d: B no puede editar los ejercicios de A');
select is(
  pg_temp.affected_rows($$ update public.exercises set archived_at = now()
     where id = current_setting('t.ex_a')::uuid $$),
  0, '15e: B no puede archivar un ejercicio de A');

-- ----- Caso 18 (la mitad): el cliente ni crea ni lee ejercicios -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.exercises), 0,
  '18a: el cliente todavía no lee ningún ejercicio (llega en el PR 2.5)');
select throws_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'Del cliente', 'time', auth.uid()) $$,
  '42501', null, '18b: un cliente no puede crear ejercicios');
select is(
  pg_temp.affected_rows($$ update public.exercises set name = 'Del cliente' $$),
  0, '18c: un cliente no puede editar ejercicios');
select throws_ok('delete from public.exercises', '42501', null,
  'D-073: un cliente no puede borrar ejercicios');
select is((select count(*)::int from public.exercise_library), 1,
  'catálogo: lo lee cualquier usuario con sesión');

-- ----- El tope de D-086: 1.000 ejercicios sin archivar por negocio -----
-- A tiene 2 (la copia y el suyo): con 998 más llega al tope.
reset role;
insert into public.exercises (tenant_id, name, measurement)
select current_setting('t.ta')::uuid, 'Relleno ' || n, 'weight_reps'
from generate_series(1, 998) n;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select throws_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'El 1.001', 'time', auth.uid()) $$,
  'P0001', 'exercise_limit_reached', 'tope: con 1.000 sin archivar no se crea otro');
select is(
  pg_temp.affected_rows($$ update public.exercises set archived_at = now()
     where id = current_setting('t.ex_a')::uuid $$),
  1, 'tope: el coach archiva uno');
select lives_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.ta')::uuid, 'El 1.001', 'time', auth.uid()) $$,
  'tope: los archivados no cuentan');
select throws_ok(
  $$ update public.exercises set archived_at = null where id = current_setting('t.ex_a')::uuid $$,
  'P0001', 'exercise_limit_reached', 'tope: tampoco se recupera uno archivado si ya hay 1.000');

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select lives_ok(
  $$ insert into public.exercises (tenant_id, name, measurement, created_by)
     values (current_setting('t.tb')::uuid, 'Plancha', 'time', auth.uid()) $$,
  'tope: es de cada negocio, el de A no afecta a B');

reset role;
select * from finish();
rollback;
