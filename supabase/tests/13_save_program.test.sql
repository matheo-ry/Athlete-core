-- =====================================================================
-- Guardar una rutina de una vez (PR 2.6; DECISIONES D-073, D-079 y D-086).
-- save_program y set_program_archived. Caso 15 de
-- docs/referencia/pruebas-aislamiento.sql, por función.
--
-- Usuarios inventados: A y B son coaches; C es cliente de A.
-- Cada negocio nuevo trae los ejercicios del catálogo: se usan
-- "back_squat" (peso y repeticiones) y "plank" (tiempo).
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
-- En staging, el usuario temporal de la CLI no busca en "extensions", donde
-- vive pgTAP. Es la misma ruta de búsqueda que ya hay en local.
set local search_path to "$user", public, extensions;

select plan(47);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test');

-- ----- Piezas para montar la rutina que se envía -----
-- Un ejercicio con N series de 8 a 12 repeticiones.
create function pg_temp.item(p_exercise uuid, p_sets int) returns jsonb language sql as $fn$
  select jsonb_build_object('exercise_id', p_exercise, 'rest_seconds', 120, 'sets',
    (select coalesce(jsonb_agg(jsonb_build_object('reps_min', 8, 'reps_max', 12)), '[]'::jsonb)
     from generate_series(1, p_sets)))
$fn$;
-- Un bloque: el día 1, de entreno con esos ejercicios; los demás, de descanso.
create function pg_temp.block(p_cycle int, p_laps int, p_items jsonb) returns jsonb language sql as $fn$
  select jsonb_build_object('cycle_days', p_cycle, 'laps', p_laps, 'days',
    (select coalesce(jsonb_agg(jsonb_build_object(
       'day_number', n, 'kind', case when n = 1 then 'training' else 'rest' end,
       'exercises', case when n = 1 then p_items else '[]'::jsonb end) order by n), '[]'::jsonb)
     from generate_series(1, least(p_cycle, 28)) n))
$fn$;
create function pg_temp.program(p_name text, p_blocks jsonb) returns jsonb language sql as $fn$
  select jsonb_build_object('name', p_name, 'blocks', p_blocks)
$fn$;
-- La rutina tal como la carga el editor: con sus identificadores y su updated_at.
create function pg_temp.load(p_program uuid) returns jsonb language sql as $fn$
  select jsonb_build_object('id', p.id, 'expected_updated_at', p.updated_at, 'name', p.name, 'blocks',
    (select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'cycle_days', b.cycle_days, 'laps', b.laps, 'days',
       (select jsonb_agg(jsonb_build_object('id', d.id, 'day_number', d.day_number, 'kind', d.kind, 'exercises',
          (select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'exercise_id', i.exercise_id,
              'rest_seconds', i.rest_seconds, 'sets',
              (select jsonb_agg(jsonb_build_object('id', s.id, 'reps_min', s.reps_min, 'reps_max', s.reps_max,
                  'duration_seconds', s.duration_seconds) order by s.position)
               from public.program_sets s where s.day_exercise_id = i.id)) order by i.position), '[]'::jsonb)
           from public.program_day_exercises i where i.day_id = d.id)) order by d.day_number)
        from public.program_days d where d.block_id = b.id)) order by b.position)
     from public.program_blocks b where b.program_id = p.id))
  from public.programs p where p.id = p_program
$fn$;
-- Todos los identificadores de una rutina, para comprobar que se conservan.
create function pg_temp.ids(p_program uuid) returns uuid[] language sql as $fn$
  select array(
    select id from public.program_blocks where program_id = p_program
    union all select id from public.program_days where program_id = p_program
    union all select id from public.program_day_exercises where program_id = p_program
    union all select id from public.program_sets where program_id = p_program
    order by 1)
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

-- ----- A y B crean su negocio; C se une a A -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
select set_config('t.squat', (select id::text from public.exercises where library_key = 'back_squat'), true);
select set_config('t.plank', (select id::text from public.exercises where library_key = 'plank'), true);
select set_config('t.row', (select id::text from public.exercises where library_key = 'barbell_row'), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('t.squat_b', (select id::text from public.exercises where library_key = 'back_squat'), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));

-- ----- El coach crea una plantilla entera de una vez -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.p', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.program('  Prueba  ', jsonb_build_array(
    pg_temp.block(2, null, jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 3)))))) ->> 'id', true);
select is(
  (select row(name, client_id, created_by)::text from public.programs where id = current_setting('t.p')::uuid),
  row('Prueba', null::uuid, '00000000-0000-4000-8000-00000000000a'::uuid)::text,
  'crear: una plantilla, sin cliente, a nombre del coach y con el nombre sin espacios sobrantes');
select is(
  (select array[
     (select count(*)::int from public.program_blocks where program_id = current_setting('t.p')::uuid),
     (select count(*)::int from public.program_days where program_id = current_setting('t.p')::uuid),
     (select count(*)::int from public.program_day_exercises where program_id = current_setting('t.p')::uuid),
     (select count(*)::int from public.program_sets where program_id = current_setting('t.p')::uuid)]),
  array[1, 2, 1, 3], 'crear: con su bloque, sus 2 días, su ejercicio y sus 3 series');

-- ----- Actualizar conserva los identificadores de lo que no cambia (D-087) -----
select set_config('t.ids', pg_temp.ids(current_setting('t.p')::uuid)::text, true);
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_set(pg_temp.load(current_setting('t.p')::uuid), '{name}', '"Prueba retocada"')) $$,
  'actualizar: el coach guarda la rutina con otro nombre');
select is((select name from public.programs where id = current_setting('t.p')::uuid), 'Prueba retocada',
  'actualizar: el nombre cambia');
select is(pg_temp.ids(current_setting('t.p')::uuid)::text, current_setting('t.ids'),
  'actualizar: bloques, días, ejercicios y series conservan su identificador');

-- Se quita la última serie y se añade un ejercicio nuevo detrás.
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_insert(
         pg_temp.load(current_setting('t.p')::uuid) #- '{blocks,0,days,0,exercises,0,sets,2}',
         '{blocks,0,days,0,exercises,1}', pg_temp.item(current_setting('t.row')::uuid, 1))) $$,
  'actualizar: quitar una serie y añadir un ejercicio');
select is(
  (select array_agg(n order by position) from (
     select i.position, (select count(*)::int from public.program_sets s where s.day_exercise_id = i.id) as n
     from public.program_day_exercises i where i.program_id = current_setting('t.p')::uuid) x),
  array[2, 1], 'actualizar: lo que ya no viene se borra y lo nuevo se crea, en su orden');
select ok(
  (select count(*) = 6 from unnest(pg_temp.ids(current_setting('t.p')::uuid)) id
   where id = any (current_setting('t.ids')::uuid[])),
  'actualizar: lo que sigue (1 bloque, 2 días, 1 ejercicio y 2 series) conserva su identificador');

-- ----- Guardado desde otro dispositivo (D-079) -----
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_set(pg_temp.load(current_setting('t.p')::uuid), '{expected_updated_at}', '"2026-01-01T00:00:00Z"')
         || '{"name": "Pisada"}') $$,
  'P0001', 'program_conflict', 'conflicto: si la rutina cambió desde que se cargó, no se guarda');

-- ----- O todo o nada -----
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_insert(pg_temp.load(current_setting('t.p')::uuid) || '{"name": "A medias"}',
         '{blocks,1}', pg_temp.block(2, 53, '[]'))) $$,
  'P0001', 'invalid_laps', 'todo o nada: un bloque que no vale tumba el guardado');
select is(
  (select row(p.name, (select count(*) from public.program_blocks b where b.program_id = p.id))::text
   from public.programs p where p.id = current_setting('t.p')::uuid),
  row('Prueba retocada', 1::bigint)::text, 'todo o nada: no se guardó ni el nombre ni el primer bloque');

-- ----- Los topes de D-086 y las reglas de la rutina, cada una con su error -----
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('', jsonb_build_array(pg_temp.block(1, null, '[]')))) $$,
  'P0001', 'invalid_name', 'una rutina tiene nombre');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Sin bloques', '[]')) $$,
  'P0001', 'program_needs_block', 'una rutina tiene al menos un bloque');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Muchos bloques',
       (select jsonb_agg(pg_temp.block(1, 1, '[]')) from generate_series(1, 13)))) $$,
  'P0001', 'too_many_blocks', 'D-086: 12 bloques como mucho');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Ciclo largo',
       jsonb_build_array(jsonb_build_object('cycle_days', 29, 'days', '[]'::jsonb)))) $$,
  'P0001', 'invalid_cycle', 'D-086: un ciclo de 28 días como mucho');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Sin fin a medias',
       jsonb_build_array(pg_temp.block(1, null, '[]'), pg_temp.block(1, 2, '[]')))) $$,
  'P0001', 'invalid_laps', 'D-075: solo el último bloque puede no tener fecha de fin');
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Dos bloques',
       jsonb_build_array(pg_temp.block(7, 4, '[]'), pg_temp.block(7, null, '[]')))) $$,
  'D-075: dos bloques, el último sin fecha de fin, valen');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Falta un día',
       jsonb_build_array(pg_temp.block(3, null, '[]') #- '{days,2}'))) $$,
  'P0001', 'invalid_days', 'D-075: hay una fila por cada día del ciclo');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Descanso con ejercicios',
       jsonb_build_array(jsonb_set(
         pg_temp.block(1, null, jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 1))),
         '{days,0,kind}', '"rest"')))) $$,
  'P0001', 'rest_day_with_exercises', 'un día de descanso no lleva ejercicios');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Muchos ejercicios',
       jsonb_build_array(pg_temp.block(1, null,
         (select jsonb_agg(pg_temp.item(current_setting('t.squat')::uuid, 1)) from generate_series(1, 31)))))) $$,
  'P0001', 'too_many_exercises', 'D-086: 30 ejercicios por día como mucho');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Muchas series',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 11)))))) $$,
  'P0001', 'too_many_sets', 'D-086: 10 series por ejercicio como mucho');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Sin series',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 0)))))) $$,
  'P0001', 'exercise_needs_sets', 'D-076: un ejercicio lleva al menos una serie');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Plancha a repeticiones',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.plank')::uuid, 1)))))) $$,
  'P0001', 'invalid_set_target', 'D-072: un ejercicio de tiempo no lleva repeticiones');
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Plancha a tiempo',
       jsonb_build_array(pg_temp.block(1, null, jsonb_build_array(jsonb_build_object(
         'exercise_id', current_setting('t.plank'),
         'sets', jsonb_build_array(jsonb_build_object('duration_seconds', 45)))))))) $$,
  'D-072: un ejercicio de tiempo lleva segundos');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Bloque ajeno',
       jsonb_build_array(pg_temp.block(1, null, '[]')
         || jsonb_build_object('id', (select id from public.program_blocks
                                      where program_id = current_setting('t.p')::uuid))))) $$,
  'P0001', 'invalid_reference', 'un bloque de otra rutina no se puede traer con su identificador');

-- ----- Ejercicios archivados (D-073) -----
update public.exercises set archived_at = now() where id = current_setting('t.squat')::uuid;
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.load(current_setting('t.p')::uuid)) $$,
  'D-073: una rutina conserva un ejercicio que se archivó después');
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Con archivado',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 1)))))) $$,
  'P0001', 'exercise_archived', 'D-073: un ejercicio archivado no se añade a una rutina nueva');
update public.exercises set archived_at = null where id = current_setting('t.squat')::uuid;

-- ----- Caso 15, por función: ni otro coach ni un cliente -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Intrusa',
       jsonb_build_array(pg_temp.block(1, null, '[]')))) $$,
  'P0001', 'not_allowed', '15a: B no puede crear una rutina en el negocio de A');
select throws_ok(
  $$ select public.save_program(current_setting('t.tb')::uuid,
       jsonb_build_object('id', current_setting('t.p'), 'expected_updated_at', now(), 'name', 'Robada',
                          'blocks', jsonb_build_array(pg_temp.block(1, null, '[]')))) $$,
  'P0001', 'program_not_found', '15b: ni guardar una rutina de A diciendo que es de su negocio');
select throws_ok(
  $$ select public.save_program(current_setting('t.tb')::uuid, pg_temp.program('Con ejercicio ajeno',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 1)))))) $$,
  'P0001', 'exercise_not_found', '15c: ni usar un ejercicio de A en una rutina suya');
select lives_ok(
  $$ select public.save_program(current_setting('t.tb')::uuid, pg_temp.program('De B',
       jsonb_build_array(pg_temp.block(1, null,
         jsonb_build_array(pg_temp.item(current_setting('t.squat_b')::uuid, 1)))))) $$,
  '15d: B guarda en su negocio con sus ejercicios');
select throws_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.p')::uuid, true) $$,
  'P0001', 'not_allowed', '15e: B no puede archivar una plantilla de A');

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('Del cliente',
       jsonb_build_array(pg_temp.block(1, null, '[]')))) $$,
  'P0001', 'not_allowed', 'un cliente no puede guardar una rutina');
select throws_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.p')::uuid, true) $$,
  'P0001', 'not_allowed', 'ni archivar una plantilla');
set local role anon;
select throws_ok(
  $$ select public.save_program('00000000-0000-4000-8000-000000000000', '{}') $$,
  '42501', null, 'sin sesión no se puede llamar a save_program');
reset role;

-- ----- Una rutina de cliente se guarda igual que una plantilla, sin cambiar de cliente -----
insert into public.programs (tenant_id, name, client_id, starts_on)
values (current_setting('t.ta')::uuid, 'Rutina de C', '00000000-0000-4000-8000-00000000000c', current_date);
select set_config('t.pc', (select id::text from public.programs where name = 'Rutina de C'), true);
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_build_object('id', current_setting('t.pc'),
         'expected_updated_at', (select updated_at from public.programs where id = current_setting('t.pc')::uuid),
         'name', 'Rutina de C, retocada',
         'blocks', jsonb_build_array(pg_temp.block(2, null,
           jsonb_build_array(pg_temp.item(current_setting('t.squat')::uuid, 2)))))) $$,
  'cliente: el coach guarda la rutina de un cliente');
select is(
  (select row(name, client_id, starts_on)::text from public.programs where id = current_setting('t.pc')::uuid),
  row('Rutina de C, retocada', '00000000-0000-4000-8000-00000000000c'::uuid, current_date)::text,
  'cliente: sigue siendo de C, con su fecha de inicio');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.program_sets), 2, 'cliente: C lee las series que guardó su coach');

-- ----- Archivar y recuperar una plantilla -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select lives_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.p')::uuid, true) $$,
  'archivar: el coach archiva una plantilla');
select ok((select archived_at is not null from public.programs where id = current_setting('t.p')::uuid),
  'archivar: queda archivada');
select throws_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.pc')::uuid, true) $$,
  'P0001', 'not_a_template', 'archivar: la rutina de un cliente no se archiva');
select throws_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, gen_random_uuid(), true) $$,
  'P0001', 'program_not_found', 'archivar: una rutina que no existe da su error');

-- ----- El tope de D-086: 300 plantillas sin archivar por negocio -----
-- A tiene 2 sin archivar ("Dos bloques" y "Plancha a tiempo"): con 298 más llega al tope.
reset role;
insert into public.programs (tenant_id, name)
select current_setting('t.ta')::uuid, 'Relleno ' || n from generate_series(1, 298) n;
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select throws_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid, pg_temp.program('La 301',
       jsonb_build_array(pg_temp.block(1, null, '[]')))) $$,
  'P0001', 'template_limit_reached', 'tope: con 300 plantillas sin archivar no se crea otra');
select throws_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.p')::uuid, false) $$,
  'P0001', 'template_limit_reached', 'tope: ni se recupera una archivada');
select lives_ok(
  $$ select public.save_program(current_setting('t.ta')::uuid,
       jsonb_set(pg_temp.load((select id from public.programs where name = 'Dos bloques')), '{name}', '"Dos bloques, v2"')) $$,
  'tope: actualizar una que ya existe sigue funcionando');
select lives_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid,
       (select id from public.programs where name = 'Relleno 1'), true) $$,
  'tope: se archiva una');
select lives_ok(
  $$ select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.p')::uuid, false) $$,
  'tope: y entonces sí se recupera la otra (las archivadas y las de clientes no cuentan)');

reset role;
select * from finish();
rollback;
