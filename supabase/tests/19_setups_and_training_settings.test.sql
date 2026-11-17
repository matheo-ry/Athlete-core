-- =====================================================================
-- Set-up, ajustes de entreno y el interruptor de logros (PR 3.3b;
-- DECISIONES D-120, D-122, D-123, D-130 y D-141).
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

select plan(26);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

-- El cliente no lee los ejercicios del negocio: sus ids se guardan antes.
create function pg_temp.setup(p_text text, p_exercise text default 't.squat',
                              p_tenant text default 't.ta') returns void language sql as $fn$
  insert into public.client_exercise_setups (tenant_id, client_id, exercise_id, setup)
  values (current_setting(p_tenant)::uuid, auth.uid(), current_setting(p_exercise)::uuid, p_text)
$fn$;
create function pg_temp.seen() returns int language sql as $fn$
  select count(*)::int from public.client_exercise_setups
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select set_config('t.b', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);

-- ----- A y B crean su negocio; C y D se unen a A -----
set local role authenticated;
select set_config('request.jwt.claims', current_setting('t.b'), true);
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('t.squat_b', (select id from public.exercises where library_key = 'back_squat')::text, true);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.squat', (select id from public.exercises where library_key = 'back_squat')::text, true);
select set_config('t.bench', (select id from public.exercises where library_key = 'barbell_bench_press')::text, true);
select set_config('t.code_a',
  (select code from public.tenant_invites where is_active and tenant_id = current_setting('t.ta')::uuid), true);
select set_config('request.jwt.claims', current_setting('t.c'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.d'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));

-- ===== El set-up =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select lives_ok($$ select pg_temp.setup('Asiento 2 · Agarre línea 3') $$, 'el cliente guarda su set-up de un ejercicio');
select throws_ok($$ select pg_temp.setup('Asiento 3') $$, '23505', null,
  'uno por cliente y ejercicio, compartido entre rutinas (D-122)');
select lives_ok($$ update public.client_exercise_setups set setup = 'Asiento 3' $$, 'el cliente lo cambia');
select throws_ok($$ select pg_temp.setup(repeat('x', 501), 't.bench') $$, '23514', null, 'hasta 500 caracteres');
select throws_ok($$ select pg_temp.setup('   ', 't.bench') $$, '23514', null, 'vacío no vale');
select throws_ok($$ select pg_temp.setup('Asiento 1', 't.squat_b', 't.tb') $$, '42501', null,
  'no guarda set-up en un negocio del que no es cliente');
select is(pg_temp.seen(), 1, 'el cliente ve su set-up');

select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(pg_temp.seen(), 0, 'un cliente no ve el set-up de otro');
update public.client_exercise_setups set setup = 'Hackeado';
select set_config('request.jwt.claims', current_setting('t.a'), true);
select is((select setup from public.client_exercise_setups), 'Asiento 3',
  'un cliente no cambia el set-up de otro; el coach ve el de su cliente');
select throws_ok($$ insert into public.client_exercise_setups (tenant_id, client_id, exercise_id, setup)
  values (current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c',
          current_setting('t.bench')::uuid, 'Banco 4') $$, '42501', null, 'el coach no escribe el set-up de su cliente');
delete from public.client_exercise_setups;
select is(pg_temp.seen(), 1, 'el coach no borra el set-up de su cliente');
select set_config('request.jwt.claims', current_setting('t.b'), true);
select is(pg_temp.seen(), 0, 'un coach de otro negocio no ve el set-up');
set local role anon;
select throws_ok($$ select count(*) from public.client_exercise_setups $$, '42501', null, 'sin sesión no se ve nada');
set local role authenticated;

-- ===== Los ajustes de entreno del cliente =====
select set_config('request.jwt.claims', current_setting('t.c'), true);
select is((select (default_rest_seconds, rest_autostart, rest_sound, rest_vibration, same_button)::text
           from public.profiles where user_id = auth.uid()),
  '(120,t,t,t,previous)', 'de partida: descanso de 2:00, arranca solo, con sonido y vibración, "Igual" copia la vez anterior');
select lives_ok($$ update public.profiles set default_rest_seconds = 90, rest_sound = false,
  same_button = 'previous_then_today' where user_id = auth.uid() $$, 'el cliente cambia sus ajustes');
select throws_ok($$ update public.profiles set same_button = 'otro' where user_id = auth.uid() $$,
  '23514', null, '"Igual" solo tiene dos formas');
select throws_ok($$ update public.profiles set default_rest_seconds = 4000 where user_id = auth.uid() $$,
  '23514', null, 'un descanso imposible no vale');
select set_config('request.jwt.claims', current_setting('t.a'), true);
select is((select default_rest_seconds from public.profiles where user_id = '00000000-0000-4000-8000-00000000000c'),
  90, 'son de la persona: el coach los ve');
update public.profiles set default_rest_seconds = 30 where user_id = '00000000-0000-4000-8000-00000000000c';
select is((select default_rest_seconds from public.profiles where user_id = '00000000-0000-4000-8000-00000000000c'),
  90, 'el coach no cambia los ajustes de su cliente');

-- ===== El interruptor de logros =====
select is(public.achievements_enabled(current_setting('t.ta')::uuid), true, 'D-130: los logros, activados por defecto');
select lives_ok($$ update public.tenants set settings = settings || '{"achievementsEnabled": false}'
  where id = current_setting('t.ta')::uuid $$, 'el dueño los apaga');
select is(public.achievements_enabled(current_setting('t.ta')::uuid), false, 'y quedan apagados');
select throws_ok($$ update public.tenants set settings = settings || '{"achievementsEnabled": "no"}'
  where id = current_setting('t.ta')::uuid $$, '23514', null, 'el interruptor es un sí o un no');
select set_config('request.jwt.claims', current_setting('t.c'), true);
update public.tenants set settings = settings || '{"achievementsEnabled": true}' where id = current_setting('t.ta')::uuid;
select is(public.achievements_enabled(current_setting('t.ta')::uuid), false, 'el cliente no los cambia');

-- ===== Cliente dado de baja =====
select set_config('request.jwt.claims', current_setting('t.a'), true);
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
select set_config('request.jwt.claims', current_setting('t.c'), true);
select is(pg_temp.seen(), 0, 'un cliente dado de baja no lee su set-up');
select throws_ok($$ select pg_temp.setup('Banco 4', 't.bench') $$, '42501', null, 'ni lo escribe');

set local role postgres;
select * from finish();
rollback;
