-- =====================================================================
-- Rutinas, bloques y días (PR 2.5a; DECISIONES D-075, D-078, D-081 a D-083).
-- Adapta a estas tablas los casos 15, 16, 18, 19 y 28 de
-- docs/referencia/pruebas-aislamiento.sql. El caso 17 con ejercicios llega
-- con el test 12 (PR 2.5b); aquí se prueba con bloques.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A; E, de B.
-- Nadie escribe en estas tablas desde la app, así que las filas de prueba
-- se ponen sin RLS ("reset role"), como hará la función que guarda.
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

select plan(45);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test'),
  ('00000000-0000-4000-8000-00000000000e', 'client-e@example.test');

-- ----- A y B crean su negocio; C y D se unen a A; E, a B -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('t.code_b', (select code from public.tenant_invites where is_active), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_b'));
set local role postgres;

-- ----- Rutinas de prueba: en A, una plantilla, la de C y la de D; en B, una plantilla -----
-- Cada una con un bloque semanal y dos días (entreno y descanso).
create function pg_temp.add_program(p_key text, p_tenant uuid, p_name text, p_client uuid)
returns void language plpgsql as $fn$
declare
  v_program uuid;
  v_block   uuid;
begin
  insert into public.programs (tenant_id, name, client_id, starts_on)
  values (p_tenant, p_name, p_client, case when p_client is not null then current_date end)
  returning id into v_program;
  insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
  values (p_tenant, v_program, 1, 7) returning id into v_block;
  insert into public.program_days (tenant_id, program_id, block_id, day_number, kind, name)
  values (p_tenant, v_program, v_block, 1, 'training', 'Lunes'),
         (p_tenant, v_program, v_block, 2, 'rest', null);
  perform set_config('t.p_' || p_key, v_program::text, true);
  perform set_config('t.b_' || p_key, v_block::text, true);
end
$fn$;
select pg_temp.add_program('tpl_a', current_setting('t.ta')::uuid, 'Plantilla de A', null);
select pg_temp.add_program('c', current_setting('t.ta')::uuid, 'Rutina de C', '00000000-0000-4000-8000-00000000000c');
select pg_temp.add_program('d', current_setting('t.ta')::uuid, 'Rutina de D', '00000000-0000-4000-8000-00000000000d');
select pg_temp.add_program('tpl_b', current_setting('t.tb')::uuid, 'Plantilla de B', null);

-- ----- Sin sesión no se lee nada -----
set local role anon;
select throws_ok('select 1 from public.programs', '42501', null, 'sin sesión no se leen las rutinas');
select throws_ok('select 1 from public.program_days', '42501', null, 'sin sesión no se leen los días');
set local role postgres;

-- ----- Caso 15: el coach lee las rutinas de su negocio y nadie escribe directamente -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.programs), 3, '15a: A ve las 3 rutinas de su negocio');
select is((select count(*)::int from public.program_blocks), 3, '15b: y sus 3 bloques');
select is((select count(*)::int from public.program_days), 6, '15c: y sus 6 días');
select is(
  (select count(*)::int from public.programs where tenant_id = current_setting('t.tb')::uuid),
  0, '15d: A no ve las rutinas de B');
select throws_ok(
  $$ insert into public.programs (tenant_id, name) values (current_setting('t.ta')::uuid, 'Directa') $$,
  '42501', null, '15e: ni el coach crea una rutina directamente en su negocio');
select throws_ok(
  $$ insert into public.programs (tenant_id, name) values (current_setting('t.tb')::uuid, 'Intrusa') $$,
  '42501', null, '15f: ni en el de otro');
select throws_ok($$ update public.programs set name = 'Cambiada' $$, '42501', null,
  '15g: nadie cambia una rutina directamente');
select throws_ok('delete from public.programs', '42501', null, '15h: nadie borra una rutina directamente');
select throws_ok(
  $$ insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid, 2, 7) $$,
  '42501', null, '15i: nadie crea un bloque directamente');
select throws_ok($$ update public.program_blocks set laps = 4 $$, '42501', null,
  '15j: nadie cambia un bloque directamente');
select throws_ok('delete from public.program_blocks', '42501', null, '15k: nadie borra un bloque directamente');
select throws_ok(
  $$ insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid,
             current_setting('t.b_tpl_a')::uuid, 3, 'rest') $$,
  '42501', null, '15l: nadie crea un día directamente');
select throws_ok($$ update public.program_days set kind = 'rest' $$, '42501', null,
  '15m: nadie cambia un día directamente');
select throws_ok('delete from public.program_days', '42501', null, '15n: nadie borra un día directamente');

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select is((select array_agg(name) from public.programs), array['Plantilla de B'],
  '15o: B solo ve la rutina de su negocio');
select is((select count(*)::int from public.program_days), 2, '15p: y solo sus días');

-- ----- Caso 18: el cliente lee su rutina, con su contenido, y no escribe nada -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select array_agg(name) from public.programs), array['Rutina de C'], '18a: C lee su rutina');
select is((select count(*)::int from public.program_blocks), 1, '18b: con su bloque');
select is((select count(*)::int from public.program_days), 2, '18c: y sus días');
select throws_ok(
  $$ insert into public.programs (tenant_id, name, client_id, starts_on)
     values (current_setting('t.ta')::uuid, 'Mía', auth.uid(), current_date) $$,
  '42501', null, '18d: un cliente no puede crear una rutina');
select throws_ok($$ update public.programs set name = 'Mía' $$, '42501', null,
  '18e: ni cambiar la suya');
select throws_ok($$ update public.program_days set kind = 'rest' $$, '42501', null,
  '18f: ni cambiar sus días');

-- ----- Caso 19: un cliente no ve la rutina de otro cliente ni las plantillas -----
select is(
  (select count(*)::int from public.programs
   where id in (current_setting('t.p_d')::uuid, current_setting('t.p_tpl_a')::uuid)),
  0, '19a: C no ve la rutina de D ni la plantilla de su coach');
select is(
  (select count(*)::int from public.program_blocks
   where program_id <> current_setting('t.p_c')::uuid),
  0, '19b: ni sus bloques');
select is(
  (select count(*)::int from public.program_days
   where program_id <> current_setting('t.p_c')::uuid),
  0, '19c: ni sus días');
select ok(not public.is_program_client(current_setting('t.ta')::uuid, current_setting('t.p_d')::uuid),
  '19d: la rutina de D no es de C');

-- ----- Un cliente dado de baja no ve su rutina; al reactivarlo, vuelve (D-083) -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is(
  (select count(*)::int from public.programs) + (select count(*)::int from public.program_blocks)
    + (select count(*)::int from public.program_days),
  0, 'baja: C no ve su rutina, ni sus bloques, ni sus días');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.programs), 3, 'baja: el coach sigue viendo la rutina de C');
select public.reactivate_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-00000000000c');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.program_days), 2, 'baja: al reactivarlo, la rutina vuelve tal cual');
set local role postgres;

-- ----- Caso 16: la clave compuesta impide poner a un cliente de otro coach -----
select throws_ok(
  $$ insert into public.programs (tenant_id, name, client_id, starts_on)
     values (current_setting('t.ta')::uuid, 'Mezcla', '00000000-0000-4000-8000-00000000000e', current_date) $$,
  '23503', null, '16: una rutina de A no puede ser de un cliente de B');

-- ----- Caso 17 (bloques): no se mezclan negocios ni rutinas -----
select throws_ok(
  $$ insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid,
             current_setting('t.b_tpl_b')::uuid, 3, 'rest') $$,
  '23503', null, '17a: un día de A no puede colgar de un bloque de B');
select throws_ok(
  $$ insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid,
             current_setting('t.b_c')::uuid, 3, 'rest') $$,
  '23503', null, '17b: ni de un bloque de otra rutina del mismo negocio');
select throws_ok(
  $$ update public.programs set start_block_id = current_setting('t.b_d')::uuid
     where id = current_setting('t.p_c')::uuid $$,
  '23503', null, '17c: el bloque de inicio tiene que ser de esa misma rutina');

-- ----- Qué es una plantilla y qué una rutina de cliente (D-078) -----
select throws_ok(
  $$ insert into public.programs (tenant_id, name, starts_on)
     values (current_setting('t.ta')::uuid, 'Plantilla con fecha', current_date) $$,
  '23514', null, 'una plantilla no tiene fecha de inicio');
select throws_ok(
  $$ insert into public.programs (tenant_id, name, client_id)
     values (current_setting('t.ta')::uuid, 'Sin fecha', '00000000-0000-4000-8000-00000000000c') $$,
  '23514', null, 'la rutina de un cliente tiene fecha de inicio');
select throws_ok(
  $$ update public.programs set archived_at = now() where id = current_setting('t.p_c')::uuid $$,
  '23514', null, 'la rutina de un cliente no se archiva: se termina');

-- ----- Topes y listas cerradas (D-075 y D-086) -----
select throws_ok(
  $$ update public.programs set name = '   ' where id = current_setting('t.p_tpl_a')::uuid $$,
  '23514', null, 'el nombre no puede ser solo espacios');
select throws_ok(
  $$ update public.programs set mode = 'free' where id = current_setting('t.p_c')::uuid $$,
  '23514', null, 'D-082: el modo es calendario o lista');
select throws_ok(
  $$ update public.program_blocks set cycle_days = 29 where id = current_setting('t.b_tpl_a')::uuid $$,
  '23514', null, 'D-086: un ciclo no pasa de 28 días');
select throws_ok(
  $$ update public.program_blocks set laps = 53 where id = current_setting('t.b_tpl_a')::uuid $$,
  '23514', null, 'D-086: un bloque no pasa de 52 vueltas');
select throws_ok(
  $$ insert into public.program_blocks (tenant_id, program_id, position, cycle_days)
     values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid, 13, 7) $$,
  '23514', null, 'D-086: una rutina no pasa de 12 bloques');
select throws_ok(
  $$ do $d$ begin
       insert into public.program_days (tenant_id, program_id, block_id, day_number, kind)
       values (current_setting('t.ta')::uuid, current_setting('t.p_tpl_a')::uuid,
               current_setting('t.b_tpl_a')::uuid, 2, 'training');
       set constraints all immediate;
     end $d$ $$,
  '23505', null, 'un bloque no tiene dos veces el mismo día del ciclo');

-- ----- Caso 28: updated_at -----
-- Dentro de una transacción now() no avanza: se envejece la fila a mano.
alter table public.programs disable trigger programs_set_updated_at;
update public.programs
set created_at = now() - interval '1 day', updated_at = now() - interval '1 day'
where id = current_setting('t.p_tpl_a')::uuid;
alter table public.programs enable trigger programs_set_updated_at;
update public.programs set name = 'Plantilla de A, retocada' where id = current_setting('t.p_tpl_a')::uuid;
select ok(
  (select updated_at > created_at and updated_at = now() from public.programs
   where id = current_setting('t.p_tpl_a')::uuid),
  '28: updated_at cambia solo al editar una rutina');

select * from finish();
rollback;
