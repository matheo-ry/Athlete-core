-- =====================================================================
-- Asignar una rutina a un cliente (PR 2.12a; DECISIONES D-078, D-081 a
-- D-083 y D-105). assign_program y create_client_program. Casos 16, 17,
-- 18 y 19 de docs/referencia/pruebas-aislamiento.sql, por función.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A; E, de B.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
-- En staging, el usuario temporal de la CLI no busca en "extensions", donde
-- vive pgTAP. Es la misma ruta de búsqueda que ya hay en local.
set local search_path to "$user", public, extensions;

select plan(30);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test'),
  ('00000000-0000-4000-8000-00000000000e', 'client-e@example.test');

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
-- Las rutinas de un cliente que siguen sin terminar.
create function pg_temp.open_programs(p_client uuid) returns bigint language sql as $fn$
  select count(*) from public.programs where client_id = p_client and ended_at is null
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.today', ((now() at time zone 'utc')::date)::text, true);
select set_config('t.c', '00000000-0000-4000-8000-00000000000c', true);
select set_config('t.d', '00000000-0000-4000-8000-00000000000d', true);
select set_config('t.e', '00000000-0000-4000-8000-00000000000e', true);

-- ----- A y B crean su negocio y una plantilla; C y D se unen a A; E, a B -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
select set_config('t.tpl', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template('Plantilla A', (select id from public.exercises where library_key = 'back_squat'))) ->> 'id', true);
select set_config('t.tpl_old', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template('Archivada', (select id from public.exercises where library_key = 'back_squat'))) ->> 'id', true);
select public.set_program_archived(current_setting('t.ta')::uuid, current_setting('t.tpl_old')::uuid, true);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('t.code_b', (select code from public.tenant_invites where is_active), true);
select set_config('t.tpl_b', public.save_program(current_setting('t.tb')::uuid,
  pg_temp.template('Plantilla B', (select id from public.exercises where library_key = 'back_squat'))) ->> 'id', true);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_b'));

-- ===== Asignar a varios a la vez: cada uno recibe su copia completa =====
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is(
  jsonb_array_length(public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
    array[current_setting('t.c')::uuid, current_setting('t.d')::uuid, current_setting('t.c')::uuid],
    current_setting('t.today')::date, 'calendar', current_setting('t.today')::date)),
  2, 'asignar a dos clientes (uno repetido) crea dos rutinas');
select is(
  (select count(*) from public.programs
   where client_id = current_setting('t.c')::uuid and name = 'Plantilla A' and mode = 'calendar'
     and starts_on = current_setting('t.today')::date
     and source_program_id = current_setting('t.tpl')::uuid),
  1::bigint, 'la copia lleva el nombre, la fecha, el modo y de qué plantilla salió');
select is(
  (select count(*) from public.program_days d join public.programs p on p.id = d.program_id
   where p.client_id = current_setting('t.c')::uuid),
  7::bigint, 'la copia tiene los 7 días');
select is(
  (select count(*) from public.program_sets s join public.programs p on p.id = s.program_id
   where p.client_id = current_setting('t.c')::uuid),
  3::bigint, 'la copia tiene las 3 series');
select is(
  (select count(*) from public.program_sets where program_id = current_setting('t.tpl')::uuid),
  3::bigint, 'la plantilla sigue con sus 3 series');
select is(
  (select count(*) from public.audit_log
   where tenant_id = current_setting('t.ta')::uuid and action = 'program.assigned'),
  2::bigint, 'cada asignación deja constancia en audit_log');

-- ===== Reglas de D-081: vigente y próxima =====
select lives_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date - 2, 'list',
  current_setting('t.today')::date) $$, 'se puede asignar con fecha pasada');
select is(pg_temp.open_programs(current_setting('t.c')::uuid), 1::bigint,
  'con fecha de hoy o pasada, la vigente queda terminada');
select is(
  (select count(*) from public.programs where client_id = current_setting('t.c')::uuid),
  2::bigint, 'la anterior no se borra');

select lives_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date + 7, 'calendar',
  current_setting('t.today')::date) $$, 'se puede asignar con fecha futura');
select is(pg_temp.open_programs(current_setting('t.c')::uuid), 2::bigint,
  'con fecha futura queda como próxima y la vigente sigue');
select lives_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date + 10, 'calendar',
  current_setting('t.today')::date) $$, 'se puede asignar otra con fecha futura');
select is(
  (select array_agg(starts_on order by starts_on) from public.programs
   where client_id = current_setting('t.c')::uuid and ended_at is null),
  array[current_setting('t.today')::date - 2, current_setting('t.today')::date + 10],
  'la nueva próxima sustituye a la que había');

-- ===== Crear una rutina vacía (D-078) =====
select set_config('t.empty', public.create_client_program(current_setting('t.ta')::uuid,
  current_setting('t.d')::uuid, '  Desde cero  ', 5, current_setting('t.today')::date, 'list',
  current_setting('t.today')::date)::text, true);
select is(
  (select name || '/' || mode from public.programs where id = current_setting('t.empty')::uuid),
  'Desde cero/list', 'la rutina vacía se crea con su nombre y su modo');
select is(
  (select count(*) from public.program_days
   where program_id = current_setting('t.empty')::uuid and kind = 'rest'),
  5::bigint, 'la rutina vacía tiene todos sus días de descanso');
select is(pg_temp.open_programs(current_setting('t.d')::uuid), 1::bigint,
  'crear una rutina vacía también termina la vigente');

-- ===== Lo que no se admite =====
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date + 5) $$, 'P0001', 'invalid_today', 'un "hoy" lejos de la fecha del servidor no vale');
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date + 400, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'invalid_start', 'una fecha de inicio a más de un año no vale');
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'weekly',
  current_setting('t.today')::date) $$, 'P0001', 'invalid_mode', 'un modo desconocido no vale');
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  '{}'::uuid[], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'invalid_clients', 'sin clientes no se asigna');
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl_old')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'template_archived', 'una plantilla archivada no se asigna');
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.empty')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'not_a_template', 'la rutina de un cliente no se asigna a otro');

-- Caso 16: un cliente de otro negocio. O todos o ninguno: C tampoco recibe nada.
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid, current_setting('t.e')::uuid], current_setting('t.today')::date,
  'calendar', current_setting('t.today')::date) $$, 'P0001', 'client_not_found',
  'caso 16: no se asigna a un cliente de otro negocio');
select is(
  (select count(*) from public.programs where client_id = current_setting('t.c')::uuid),
  3::bigint, 'si un cliente no vale, no se asigna a nadie');
-- Caso 17: la plantilla de otro negocio.
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl_b')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'program_not_found',
  'caso 17: no se usa la plantilla de otro negocio');

-- A un cliente dado de baja no se le asigna nada; sus rutinas se conservan (D-083).
select public.archive_client(current_setting('t.ta')::uuid, current_setting('t.d')::uuid);
select throws_ok($$ select public.create_client_program(current_setting('t.ta')::uuid,
  current_setting('t.d')::uuid, 'Otra', 7, current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'client_not_found',
  'a un cliente dado de baja no se le crea una rutina');
select is(
  (select count(*) from public.programs where client_id = current_setting('t.d')::uuid),
  2::bigint, 'las rutinas del cliente dado de baja se conservan');

-- ===== Caso 18: un cliente no puede usar estas funciones =====
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select throws_ok($$ select public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array[current_setting('t.c')::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) $$, 'P0001', 'not_allowed', 'caso 18: un cliente no puede asignar');

-- ===== Caso 19: cada cliente ve solo su copia =====
select is(
  (select count(*) || '/' || count(*) filter (where client_id = current_setting('t.c')::uuid)
   from public.programs),
  '3/3', 'caso 19: el cliente ve sus rutinas y ninguna más');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select is((select count(*) from public.programs), 0::bigint,
  'el cliente dado de baja no ve la suya');

select * from finish();
rollback;
