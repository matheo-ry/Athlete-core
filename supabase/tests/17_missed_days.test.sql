-- =====================================================================
-- El día saltado (PR 3.2b; DECISIONES D-105, D-125 y D-139): las tablas
-- program_missed_day_rules y program_missed_days, set_missed_day_rule y
-- record_missed_days. Aislamiento (casos 16 a 18) y sus reglas.
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

select plan(28);

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
create function pg_temp.rule(p_rule text, p_program text default 't.p') returns void language sql as $fn$
  select public.set_missed_day_rule(current_setting('t.ta')::uuid, current_setting(p_program)::uuid,
    p_rule, current_setting('t.today')::date)
$fn$;
-- Apunta como faltado el día p_day de la rutina, tantos días antes de hoy.
create function pg_temp.missed(p_day int, p_days_ago int) returns void language sql as $fn$
  select public.record_missed_days(current_setting('t.ta')::uuid, current_setting('t.p')::uuid,
    jsonb_build_array(jsonb_build_object(
      'program_day_id', (select id from public.program_days
                         where program_id = current_setting('t.p')::uuid and day_number = p_day),
      'missed_on', current_setting('t.today')::date - p_days_ago)),
    current_setting('t.today')::date)
$fn$;
-- Cuántas reglas y días faltados ve quien llama.
create function pg_temp.seen() returns int[] language sql as $fn$
  select array[(select count(*)::int from public.program_missed_day_rules),
               (select count(*)::int from public.program_missed_days)]
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.today', ((now() at time zone 'utc')::date)::text, true);
select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);

-- ----- A y B crean su negocio; C y D se unen a A; C empezó hace 14 días -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a',
  (select code from public.tenant_invites where is_active and tenant_id = current_setting('t.ta')::uuid), true);
select set_config('t.tpl', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template((select id from public.exercises where library_key = 'back_squat'))) ->> 'id', true);
select set_config('request.jwt.claims', current_setting('t.c'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.d'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.p', public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array['00000000-0000-4000-8000-00000000000c'::uuid], current_setting('t.today')::date - 14, 'calendar',
  current_setting('t.today')::date) -> 0 ->> 'program_id', true);
select set_config('t.list', public.assign_program(current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array['00000000-0000-4000-8000-00000000000d'::uuid], current_setting('t.today')::date, 'list',
  current_setting('t.today')::date) -> 0 ->> 'program_id', true);

-- ===== La regla del día saltado =====
select is(pg_temp.seen(), array[0, 0], 'sin cambiar nada, la regla es "se pierde" (no hay filas)');
select lives_ok($$ select pg_temp.rule('shift') $$, 'el coach elige "se mueve todo"');
select is((select (rule, starts_on)::text from public.program_missed_day_rules),
  (select ('shift', current_setting('t.today'))::text), 'D-125: la regla vale desde el día en que se cambia');
select is((select count(*)::int from public.audit_log where action = 'program.missed_day_rule_changed'), 1,
  'el cambio de regla queda en audit_log');
select pg_temp.rule('recover');
select is((select array_agg(rule) from public.program_missed_day_rules), array['recover'],
  'si la cambia dos veces el mismo día, vale la última');
select throws_ok($$ select pg_temp.rule('skip') $$, 'P0001', 'invalid_rule', 'solo valen las tres reglas');
select throws_ok($$ select pg_temp.rule('lose', 't.tpl') $$, 'P0001', 'not_a_client_program',
  'una plantilla no tiene regla del día saltado');
select throws_ok($$ select pg_temp.rule('lose', 't.list') $$, 'P0001', 'invalid_mode',
  'en modo lista no hay día saltado (D-125)');
select throws_ok($$ select public.set_missed_day_rule(current_setting('t.ta')::uuid, current_setting('t.p')::uuid,
  'lose', current_setting('t.today')::date + 9) $$, 'P0001', 'invalid_today', 'un "hoy" lejos de la fecha del servidor no vale');
select throws_ok($$ insert into public.program_missed_day_rules (tenant_id, program_id, rule, starts_on)
  values (current_setting('t.ta')::uuid, current_setting('t.p')::uuid, 'lose', current_date) $$,
  '42501', null, 'el coach no escribe la regla directamente: solo con set_missed_day_rule');

select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok($$ select pg_temp.rule('lose') $$, 'P0001', 'not_allowed', 'el cliente no cambia la regla del día saltado');
select set_config('request.jwt.claims', current_setting('t.d'), true);
select throws_ok($$ select pg_temp.rule('lose') $$, 'P0001', 'not_allowed', 'otro cliente tampoco');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select throws_ok($$ select pg_temp.rule('lose') $$, 'P0001', 'not_allowed', 'caso 16: un coach de otro negocio tampoco');

-- ===== Los días faltados =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select lives_ok($$ select pg_temp.missed(1, 14) $$, 'el cliente apunta el lunes que faltó');
select pg_temp.missed(1, 7);
select pg_temp.missed(1, 7);
select is((select array_agg(day_number order by missed_on) from public.program_missed_days), array[1, 1]::smallint[],
  'apuntar otra vez el mismo día faltado no lo duplica');
select is(pg_temp.seen(), array[1, 2], 'el cliente ve la regla y los días faltados de su rutina');
select throws_ok($$ select pg_temp.missed(1, 0) $$, 'P0001', 'invalid_date', 'hoy todavía no está faltado');
select throws_ok($$ select pg_temp.missed(1, 21) $$, 'P0001', 'invalid_date', 'antes de empezar la rutina no se falta');
select throws_ok($$ select pg_temp.missed(2, 6) $$, 'P0001', 'invalid_reference', 'un día de descanso no se falta');
select throws_ok($$ delete from public.program_missed_days $$, '42501', null, 'el cliente no borra días faltados');

select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(pg_temp.seen(), array[0, 0], 'caso 18: un cliente no ve la regla ni los días faltados de otro');
select throws_ok($$ select pg_temp.missed(1, 3) $$, 'P0001', 'program_not_found', 'un cliente no apunta días en la rutina de otro');

select set_config('request.jwt.claims', current_setting('t.a'), true);
select is(pg_temp.seen(), array[1, 2], 'el coach ve la regla y los días faltados de sus clientes');
select throws_ok($$ select pg_temp.missed(1, 3) $$, 'P0001', 'not_allowed', 'el coach no apunta días faltados: los apunta la app del cliente');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select is(pg_temp.seen(), array[0, 0], 'caso 16: un coach no ve los de otro negocio');
set local role anon;
select throws_ok($$ select count(*) from public.program_missed_days $$, '42501', null, 'sin sesión no se ve nada');
set local role authenticated;

-- ===== Cliente dado de baja =====
select set_config('request.jwt.claims', current_setting('t.a'), true);
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok($$ select pg_temp.missed(1, 3) $$, 'P0001', 'not_allowed', 'un cliente dado de baja no apunta días faltados');
select is(pg_temp.seen(), array[0, 0], 'un cliente dado de baja no lee la regla ni sus días faltados');

set local role postgres;
select * from finish();
rollback;
