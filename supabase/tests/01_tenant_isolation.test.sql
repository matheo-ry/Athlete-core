-- =====================================================================
-- Aislamiento entre tenants y permisos de cada rol.
-- Adapta los casos 01 a 14 y 20 a 22 de docs/referencia/pruebas-aislamiento.sql.
-- Los casos 15 a 19 y 28 usan tablas de negocio que aún no existen: se
-- escriben con el módulo de cada tabla.
--
-- Cómo se simula un usuario: "set local role authenticated" más el JWT en
-- request.jwt.claims, que es lo que lee auth.uid() en Supabase.
-- Todo va dentro de una transacción que se deshace al final.
--
-- Usuarios inventados: A y B son coaches; C, D, E y F, clientes.
-- =====================================================================
begin;
set local role postgres;
grant usage on schema extensions to public;
-- En staging, el usuario temporal de la CLI (cli_login_postgres) es miembro
-- de postgres pero no asume el rol automáticamente ni tiene permisos sobre
-- "extensions" ni "auth". Asumimos postgres y concedemos uso de "extensions"
-- a public para que pgTAP siga disponible tras cualquier "reset role;".
set local role postgres;
grant usage on schema extensions to public;
create extension if not exists pgtap with schema extensions;
set local search_path to "$user", public, extensions;

select plan(34);

-- Cuántas filas cambia una sentencia, ejecutada con el rol y el usuario del
-- momento (security invoker), así que el RLS se aplica. Las políticas de
-- UPDATE ocultan las filas ajenas en vez de dar error: 0 filas = bloqueado.
-- Vive en pg_temp y desaparece con la transacción.
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

-- ----- Preparación: seis usuarios. El trigger on_auth_user_created crea sus perfiles -----
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test'),
  ('00000000-0000-4000-8000-00000000000e', 'client-e@example.test'),
  ('00000000-0000-4000-8000-00000000000f', 'client-f@example.test');

-- 01
select is(
  (select count(*)::int from public.profiles where user_id::text like '00000000-0000-4000-8000-%'),
  6,
  '01: el trigger crea un perfil por usuario'
);

-- ----- anon no puede nada -----
set local role anon;
select throws_ok('select 1 from public.tenants', '42501', null, '02: anon no puede leer tenants');
select throws_ok($$ select public.create_tenant('X', 'v1') $$, '42501', null, '03: anon no puede crear un negocio');
select is(public.preview_invite('ABCDEFG2') ->> 'status', 'invalid_code', '04: anon puede pedir la vista previa de un código (D-051), y uno falso no vale');
set local role postgres;

-- ----- A y B crean su negocio -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
select throws_ok(
  $$ select public.create_tenant('Otro', 'test-terms') $$,
  'P0001', 'already_owner',
  '05: un usuario no puede ser dueño de dos negocios'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);

-- ----- B no ve nada de A -----
select is((select count(*)::int from public.tenants), 1, '06a: B solo ve su tenant');
select is(
  (select count(*)::int from public.tenant_invites where tenant_id = current_setting('t.ta')::uuid),
  0, '06b: B no ve el código de A'
);
select is(
  (select count(*)::int from public.tenant_members where tenant_id = current_setting('t.ta')::uuid),
  0, '06c: B no ve los miembros de A'
);
select is(
  pg_temp.affected_rows($$ update public.tenants set settings = '{"hack":true}' where id = current_setting('t.ta')::uuid $$),
  0, '06d: B no puede editar el tenant de A'
);
select throws_ok(
  $$ select public.regenerate_invite_code(current_setting('t.ta')::uuid) $$,
  'P0001', 'not_allowed',
  '07: un coach no puede regenerar el código de otro'
);

-- ----- C se une a A con el código -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.tenants), 0, '08a: antes de unirse, C no ve ningún tenant');
select is(
  public.preview_invite(lower(current_setting('t.code_a'))) ->> 'name',
  'Coach A',
  '08b: preview_invite muestra el coach del código (sin distinguir mayúsculas)'
);
select is(
  public.join_tenant_with_code('ZZZZZZZZ') ->> 'status',
  'invalid_code',
  '08c: un código falso no se acepta'
);
select is(
  public.join_tenant_with_code(current_setting('t.code_a')),
  jsonb_build_object('status', 'joined', 'tenant_id', current_setting('t.ta')::uuid),
  '08d: unirse con el código devuelve el tenant del coach'
);
select is(
  public.join_tenant_with_code(current_setting('t.code_a')) ->> 'status',
  'already_member',
  '08e: repetir el código no da error: ya era cliente'
);
select is((select count(*)::int from public.tenants), 1, '08f: tras unirse, C ve el tenant de su coach');
select is((select count(*)::int from public.tenant_members), 1, '08g: C solo ve su propia fila de miembro');
select is((select count(*)::int from public.tenant_invites), 0, '08h: el cliente no ve el código');
select is(
  pg_temp.affected_rows($$ update public.tenants set settings = '{"hack":true}' $$),
  0, '08i: el cliente no puede editar el tenant'
);
select is((select count(*)::int from public.profiles), 1, '08j: el cliente solo ve su perfil');
select throws_ok(
  $$ insert into public.tenant_members (tenant_id, user_id, role)
     values (current_setting('t.tb')::uuid, auth.uid(), 'owner') $$,
  '42501', null,
  '09: nadie puede darse de alta a mano en un tenant'
);
select throws_ok(
  $$ update public.tenant_members set role = 'owner' where user_id = auth.uid() $$,
  '42501', null,
  '10: nadie puede cambiarse el rol'
);

-- ----- A: permisos de dueño -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is(
  pg_temp.affected_rows($$ update public.tenants set settings = '{"units":"kg"}' where id = current_setting('t.ta')::uuid $$),
  1, '13a: el dueño edita los ajustes de su negocio'
);
select throws_ok($$ update public.tenants set plan = 'studio' $$, '42501', null, '11: el coach no puede cambiar su plan');
select throws_ok($$ update public.tenants set status = 'active' $$, '42501', null, '12: el coach no puede cambiar su estado');
select is((select count(*)::int from public.tenant_members), 2, '13b: el dueño ve a sus miembros');
select is((select count(*)::int from public.profiles), 2, '13c: el dueño ve los perfiles de sus miembros');

-- ----- Límite del plan (free = 3 clientes) -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}';
select is(
  public.join_tenant_with_code(current_setting('t.code_a')) ->> 'status',
  'plan_full',
  '14: se respeta el límite de clientes del plan'
);

-- ----- Dar de baja a un cliente (D-055: solo con archive_client) -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select throws_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c') $$,
  'P0001', 'not_allowed',
  '20a: un coach no puede dar de baja a un cliente de otro'
);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select lives_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c') $$,
  '20b: el coach da de baja a su cliente'
);
select throws_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, auth.uid()) $$,
  'P0001', 'not_found',
  '20c: el dueño no puede darse de baja a sí mismo'
);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.tenants), 0, '20d: un cliente dado de baja deja de ver el tenant');

-- Con el hueco libre entra F; C ya no vuelve a entrar solo con el código.
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is(
  public.join_tenant_with_code(current_setting('t.code_a')) ->> 'status',
  'archived',
  '21: dar de baja libera un hueco, y el cliente dado de baja no vuelve con el código (D-055)'
);

-- ----- Regenerar el código -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.code_a2', public.regenerate_invite_code(current_setting('t.ta')::uuid), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select ok(
  public.preview_invite(current_setting('t.code_a')) ->> 'status' = 'invalid_code'
    and public.preview_invite(current_setting('t.code_a2')) ->> 'status' = 'ok',
  '22: al regenerar, el código antiguo deja de valer y el nuevo vale'
);
set local role postgres;
select * from finish();
rollback;
