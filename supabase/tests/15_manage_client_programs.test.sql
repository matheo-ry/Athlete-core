-- =====================================================================
-- Gestionar la rutina de un cliente (PR 2.12b; DECISIONES D-078, D-081,
-- D-083 y D-105): end_program, cancel_next_program, restart_program y
-- save_program_as_template. Casos 16 a 18, por función.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
-- En staging, el usuario temporal de la CLI no busca en "extensions", donde
-- vive pgTAP. Es la misma ruta de búsqueda que ya hay en local.
set local search_path to "$user", public, extensions;

select plan(29);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

-- Una plantilla semanal: el lunes, un ejercicio con 3 series; el resto, descanso.
create function pg_temp.template(p_name text, p_exercise uuid) returns jsonb language sql as $fn$
  select jsonb_build_object('name', p_name, 'blocks', jsonb_build_array(
    jsonb_build_object('cycle_days', 7, 'laps', null, 'days',
      (select jsonb_agg(jsonb_build_object(
         'day_number', n, 'kind', case when n = 1 then 'training' else 'rest' end,
         'exercises', case when n = 1 then jsonb_build_array(jsonb_build_object(
           'exercise_id', p_exercise, 'rest_seconds', 120, 'sets',
           (select jsonb_agg(jsonb_build_object('reps_min', 8, 'reps_max', 12))
            from generate_series(1, 3)))) else '[]'::jsonb end) order by n)
       from generate_series(1, 7) n))))
$fn$;
-- Asigna la plantilla a un cliente, a tantos días de hoy, y devuelve su rutina.
create function pg_temp.assign(p_client text, p_days int) returns text language sql as $fn$
  select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
    array[current_setting(p_client)::uuid], current_setting('t.today')::date + p_days, 'calendar',
    current_setting('t.today')::date) -> 0 ->> 'program_id'
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.today', ((now() at time zone 'utc')::date)::text, true);
select set_config('t.c', '00000000-0000-4000-8000-00000000000c', true);
select set_config('t.d', '00000000-0000-4000-8000-00000000000d', true);

-- ----- A y B crean su negocio; A, una plantilla; C y D se unen a A -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a',
  (select code from public.tenant_invites where is_active and tenant_id = current_setting('t.ta')::uuid), true);
select set_config('t.tpl', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template('Plantilla A', (select id from public.exercises where library_key = 'back_squat'))) ->> 'id', true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';

-- ===== Terminar la vigente =====
select set_config('t.p1', pg_temp.assign('t.c', 0), true);
select lives_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.p1')::uuid,
  current_setting('t.today')::date) $$, 'el coach termina la rutina vigente');
select isnt((select ended_at from public.programs where id = current_setting('t.p1')::uuid), null,
  'la rutina terminada queda guardada, en "Anteriores"');
select throws_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.p1')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'program_already_ended', 'una rutina terminada no se termina otra vez');
select throws_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.p1')::uuid,
  current_setting('t.today')::date + 9) $$, 'P0001', 'invalid_today', 'un "hoy" lejos de la fecha del servidor no vale');
select throws_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'not_a_client_program', 'una plantilla no se termina');

-- ===== Cancelar la próxima =====
select set_config('t.p2', pg_temp.assign('t.c', 7), true);
select throws_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.p2')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'program_not_started', 'la próxima no se termina: se cancela');
select lives_ok($$ select public.cancel_next_program(current_setting('t.ta')::uuid, current_setting('t.p2')::uuid,
  current_setting('t.today')::date) $$, 'el coach cancela la próxima');
select is((select count(*) from public.programs where id = current_setting('t.p2')::uuid), 0::bigint,
  'la próxima cancelada se borra');
select set_config('t.p3', pg_temp.assign('t.c', 0), true);
select throws_ok($$ select public.cancel_next_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'program_already_started', 'una rutina ya empezada no se cancela');

-- ===== Reiniciar desde una fecha y un bloque =====
select lives_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date + 5, null, current_setting('t.today')::date) $$,
  'el coach reinicia la rutina desde una fecha futura');
select is(
  (select starts_on from public.programs where id = current_setting('t.p3')::uuid and ended_at is null),
  current_setting('t.today')::date + 5, 'la rutina reiniciada sigue abierta, con su fecha nueva');
select throws_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date,
  (select id from public.program_blocks where program_id = current_setting('t.tpl')::uuid),
  current_setting('t.today')::date) $$, 'P0001', 'invalid_reference', 'el bloque tiene que ser de esa rutina');
select throws_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date + 500, null, current_setting('t.today')::date) $$,
  'P0001', 'invalid_start', 'una fecha a más de un año no vale');

-- Con otra vigente: al reiniciar para hoy, la otra queda terminada (D-081).
select set_config('t.p4', pg_temp.assign('t.c', 0), true);
select lives_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date,
  (select id from public.program_blocks where program_id = current_setting('t.p3')::uuid),
  current_setting('t.today')::date) $$, 'el coach reinicia para hoy, desde un bloque');
select is(
  (select array_agg(id::text) from public.programs
   where client_id = current_setting('t.c')::uuid and ended_at is null),
  array[current_setting('t.p3')], 'la reiniciada es la única abierta: la otra vigente queda terminada');
select isnt((select start_block_id from public.programs where id = current_setting('t.p3')::uuid), null,
  'queda apuntado el bloque desde el que se retoma');
select throws_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p4')::uuid,
  current_setting('t.today')::date, null, current_setting('t.today')::date) $$,
  'P0001', 'program_already_ended', 'una rutina terminada no se reinicia');

-- ===== Guardar como plantilla =====
select set_config('t.new_tpl', public.save_program_as_template(current_setting('t.ta')::uuid,
  current_setting('t.p3')::uuid, '  De un cliente  ')::text, true);
select is(
  (select name from public.programs where id = current_setting('t.new_tpl')::uuid
     and client_id is null and starts_on is null and start_block_id is null and ended_at is null),
  'De un cliente', 'la plantilla nueva no lleva cliente ni fechas');
select is(
  (select count(*) from public.program_sets where program_id = current_setting('t.new_tpl')::uuid),
  3::bigint, 'la plantilla nueva lleva las series de la rutina');
select throws_ok($$ select public.save_program_as_template(current_setting('t.ta')::uuid,
  current_setting('t.p3')::uuid, '   ') $$, 'P0001', 'invalid_name', 'la plantilla necesita un nombre');
select is(
  (select count(distinct action) from public.audit_log
   where tenant_id = current_setting('t.ta')::uuid and action in
     ('program.ended', 'program.canceled', 'program.restarted', 'program.saved_as_template')),
  4::bigint, 'cada operación deja constancia en audit_log');

-- ===== El cliente dado de baja (D-083) =====
select set_config('t.pd', pg_temp.assign('t.d', 0), true);
select public.archive_client(current_setting('t.ta')::uuid, current_setting('t.d')::uuid);
select throws_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.pd')::uuid,
  current_setting('t.today')::date, null, current_setting('t.today')::date) $$,
  'P0001', 'client_not_found', 'a un cliente dado de baja no se le reinicia la rutina');
select is((select ended_at from public.programs where id = current_setting('t.pd')::uuid), null,
  'el reinicio fallido deja la rutina como estaba');
select lives_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.pd')::uuid,
  current_setting('t.today')::date) $$, 'la rutina de un cliente dado de baja sí se puede terminar');

-- ===== Otro negocio (casos 16 y 17) y el cliente (caso 18) =====
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select throws_ok($$ select public.end_program(current_setting('t.tb')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'program_not_found', 'otro coach no encuentra la rutina desde su negocio');
select throws_ok($$ select public.restart_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date, null, current_setting('t.today')::date) $$,
  'P0001', 'not_allowed', 'otro coach no puede reiniciar una rutina de un negocio ajeno');
select throws_ok($$ select public.save_program_as_template(current_setting('t.tb')::uuid,
  current_setting('t.p3')::uuid, 'Robada') $$, 'P0001', 'program_not_found',
  'otro coach no puede llevarse la rutina como plantilla');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select throws_ok($$ select public.end_program(current_setting('t.ta')::uuid, current_setting('t.p3')::uuid,
  current_setting('t.today')::date) $$, 'P0001', 'not_allowed', 'caso 18: un cliente no puede terminar su rutina');
select throws_ok($$ select public.save_program_as_template(current_setting('t.ta')::uuid,
  current_setting('t.p3')::uuid, 'Mía') $$, 'P0001', 'not_allowed', 'caso 18: un cliente no puede guardar plantillas');

select * from finish();
rollback;
