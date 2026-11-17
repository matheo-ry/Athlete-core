-- =====================================================================
-- Datos de salud (PR 3.3a; DECISIONES D-126, D-127 y D-140): las tablas
-- health_consents, body_weights y body_measurements, el trigger de las
-- notas del día, grant_health_consent y withdraw_health_consent.
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

select plan(35);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

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
-- Sube el entreno p_workout de C, con una nota del día (o sin ella).
create function pg_temp.note(p_workout int, p_note text) returns void language sql as $fn$
  select public.sync_workout(current_setting('t.ta')::uuid, jsonb_build_object(
    'id', '10000000-0000-4000-8000-' || lpad(p_workout::text, 12, '0'),
    'program_id', current_setting('t.p'), 'block_id', current_setting('t.blk'),
    'program_day_id', current_setting('t.day'), 'day_number', 1,
    'performed_on', current_setting('t.today'), 'started_at', current_setting('t.t0'),
    'last_changed_at', current_setting('t.t0'),
    'device_id', 'phone-a', 'device_since', current_setting('t.t0'),
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', '20000000-0000-4000-8000-' || lpad(p_workout::text, 12, '0'), 'position', 1,
      'exercise_id', current_setting('t.ex'), 'program_day_exercise_id', current_setting('t.pde'),
      'prescribed_sets', '[{"reps_min":8,"reps_max":12}]'::jsonb, 'prescribed_rest_seconds', 120,
      'changed_at', current_setting('t.t0'), 'day_note', p_note, 'sets', '[]'::jsonb))))
$fn$;
create function pg_temp.weight(p_kg numeric, p_days_ago int default 0) returns void language sql as $fn$
  insert into public.body_weights (tenant_id, user_id, measured_on, weight_kg)
  values (current_setting('t.ta')::uuid, auth.uid(), current_date - p_days_ago, p_kg)
$fn$;
create function pg_temp.measure(p_kind text, p_side text, p_cm numeric) returns void language sql as $fn$
  insert into public.body_measurements (tenant_id, user_id, measured_on, kind, side, value_cm)
  values (current_setting('t.ta')::uuid, auth.uid(), current_date, p_kind, p_side, p_cm)
$fn$;
-- Cuántos consentimientos, pesos, medidas y notas ve quien llama.
create function pg_temp.seen() returns int[] language sql as $fn$
  select array[(select count(*)::int from public.health_consents),
               (select count(*)::int from public.body_weights),
               (select count(*)::int from public.body_measurements),
               (select count(day_note)::int from public.workout_exercises)]
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.t0', (now() - interval '1 hour')::text, true);
select set_config('t.today', ((now() - interval '1 hour') at time zone 'utc')::date::text, true);
select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select set_config('t.b', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);

-- ----- A y B crean su negocio; C y D se unen a A; C recibe una rutina -----
set local role authenticated;
select set_config('request.jwt.claims', current_setting('t.b'), true);
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

-- ===== Sin consentimiento no se escribe nada de salud =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok($$ select pg_temp.weight(85) $$, '42501', null, 'sin consentimiento no se apunta el peso');
select throws_ok($$ select pg_temp.measure('waist', null, 82) $$, '42501', null, 'sin consentimiento no se apuntan medidas');
select throws_ok($$ select pg_temp.note(1, 'Dolor de hombro') $$, 'P0001', 'health_consent_required',
  'sin consentimiento se rechaza la nota del día');
select lives_ok($$ select pg_temp.note(1, null) $$, 'sin consentimiento se entrena igual, sin nota');
select throws_ok($$ insert into public.health_consents (tenant_id, user_id, granted_at, text_version)
  values (current_setting('t.ta')::uuid, auth.uid(), now(), 'v1') $$, '42501', null,
  'el consentimiento no se escribe directamente: solo con grant_health_consent');

-- ===== Dar el consentimiento =====
select throws_ok($$ select public.grant_health_consent(current_setting('t.ta')::uuid, 'Versión 1') $$,
  'P0001', 'invalid_text_version', 'la versión del texto tiene un formato fijo');
select lives_ok($$ select public.grant_health_consent(current_setting('t.ta')::uuid, '2026-11-draft') $$,
  'el cliente da el consentimiento');
select is((select (text_version, withdrawn_at is null, granted_at is not null)::text from public.health_consents),
  '(2026-11-draft,t,t)', 'se guarda la versión del texto y cuándo se dio');
set local role postgres; -- el cliente no lee audit_log
select is((select meta from public.audit_log where action = 'health_consent.granted'),
  jsonb_build_object('user_id', '00000000-0000-4000-8000-00000000000c', 'text_version', '2026-11-draft'),
  'darlo queda en audit_log, sin datos de salud');
set local role authenticated;
select lives_ok($$ select pg_temp.weight(85.4) $$, 'con consentimiento se apunta el peso');
select lives_ok($$ select pg_temp.weight(86, 7) $$, 'y el de otro día');
select throws_ok($$ select pg_temp.weight(86) $$, '23505', null, 'un solo peso por día (se actualiza, no se repite)');
select lives_ok($$ update public.body_weights set weight_kg = 85.2 where measured_on = current_date $$,
  'el cliente corrige su peso');
select throws_ok($$ select pg_temp.weight(10) $$, '23514', null, 'un peso imposible no vale');
select lives_ok($$ select pg_temp.measure('waist', null, 82) $$, 'con consentimiento se apunta la cintura');
select lives_ok($$ select pg_temp.measure('arm', 'left', 36) $$, 'y el brazo izquierdo');
select lives_ok($$ select pg_temp.measure('arm', 'right', 36.5) $$, 'y el derecho');
select throws_ok($$ select pg_temp.measure('arm', null, 36) $$, '23514', null, 'el brazo lleva lado');
select throws_ok($$ select pg_temp.measure('waist', 'left', 82) $$, '23514', null, 'la cintura no lleva lado');
select throws_ok($$ select pg_temp.measure('biceps', null, 36) $$, '23514', null, 'solo vale la lista cerrada de D-127');
select throws_ok($$ select pg_temp.measure('waist', null, 83) $$, '23505', null, 'una medida por día y lado');
select lives_ok($$ select pg_temp.note(2, 'Dolor de hombro') $$, 'con consentimiento se guarda la nota del día');
select is(pg_temp.seen(), array[1, 2, 3, 1], 'el cliente ve su consentimiento, su peso, sus medidas y su nota');

-- ===== Lo que ve y no escribe cada uno =====
select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(pg_temp.seen(), array[0, 0, 0, 0], 'un cliente no ve los datos de salud de otro');
select throws_ok($$ insert into public.body_weights (tenant_id, user_id, measured_on, weight_kg)
  values (current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c', current_date - 1, 80) $$,
  '42501', null, 'un cliente no apunta el peso de otro');

select set_config('request.jwt.claims', current_setting('t.a'), true);
select is(pg_temp.seen(), array[1, 2, 3, 1], 'el coach ve el consentimiento, el peso y las medidas de su cliente');
select throws_ok($$ insert into public.body_weights (tenant_id, user_id, measured_on, weight_kg)
  values (current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c', current_date - 1, 80) $$,
  '42501', null, 'el coach no apunta el peso de su cliente');
update public.body_measurements set value_cm = 1;
select is((select count(*)::int from public.body_measurements where value_cm = 1), 0,
  'el coach no cambia las medidas de su cliente');

select set_config('request.jwt.claims', current_setting('t.b'), true);
select is(pg_temp.seen(), array[0, 0, 0, 0], 'un coach de otro negocio no ve nada');
set local role anon;
select throws_ok($$ select count(*) from public.body_weights $$, '42501', null, 'sin sesión no se ve nada');
set local role authenticated;

-- ===== Retirar el consentimiento borra =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select lives_ok($$ select public.withdraw_health_consent(current_setting('t.ta')::uuid) $$, 'el cliente retira el consentimiento');
select is(pg_temp.seen(), array[1, 0, 0, 0], 'retirarlo borra el peso, las medidas y el texto de las notas del día');
set local role postgres;
select is((select count(*)::int from public.audit_log where action = 'health_consent.withdrawn'), 1,
  'retirarlo queda en audit_log');
set local role authenticated;

-- ===== Cliente dado de baja =====
select public.grant_health_consent(current_setting('t.ta')::uuid, '2026-11-draft');
select pg_temp.weight(85);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
select set_config('request.jwt.claims', current_setting('t.c'), true);
select is(pg_temp.seen(), array[0, 0, 0, 0], 'un cliente dado de baja no lee nada');
select throws_ok($$ select pg_temp.weight(84, 1) $$, '42501', null, 'ni apunta su peso');

set local role postgres;
select * from finish();
rollback;
