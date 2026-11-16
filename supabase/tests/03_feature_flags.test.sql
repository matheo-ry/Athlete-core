-- =====================================================================
-- Feature flags: cómo se calcula tenant_effective_features (ARQUITECTURA §9).
-- Adapta los casos 23 a 27 de docs/referencia/pruebas-aislamiento.sql.
-- Los flags de este test son inventados: el catálogo real empieza vacío.
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

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test');

insert into public.features (key, kind, sunset_at) values
  ('demo_core', 'core', null),
  ('macros_calculator', 'addon', null),
  ('new_editor', 'release', '2027-06-30'),
  ('signups', 'kill_switch', null);
insert into public.plan_features (plan, feature_key) values ('pro', 'macros_calculator');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}';
select public.create_tenant('Coach B', 'test-terms');
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);

-- Una fila por flag del catálogo (los de este test y los de los módulos reales),
-- y solo de su tenant.
select is((select count(*)::int from public.tenant_effective_features),
  (select count(*)::int from public.features),
  '23a: el coach solo ve los flags de su tenant');
select ok((select enabled from public.tenant_effective_features where feature_key = 'demo_core'),
  '23b: un flag core está activo');
select ok((select enabled from public.tenant_effective_features where feature_key = 'signups'),
  '23c: un kill_switch está activo por defecto');
select ok(not (select enabled from public.tenant_effective_features where feature_key = 'macros_calculator'),
  '23d: un addon está apagado si no lo incluye el plan');
select ok(not (select enabled from public.tenant_effective_features where feature_key = 'new_editor'),
  '23e: un flag release está apagado por defecto');
select throws_ok(
  $$ insert into public.tenant_features (tenant_id, feature_key, enabled)
     values (current_setting('t.ta')::uuid, 'macros_calculator', true) $$,
  '42501', null, '24: el coach no puede activarse funciones de pago');
select throws_ok($$ update public.features set is_enabled = true $$, '42501', null,
  '25: el coach no puede tocar el catálogo de flags');

-- El propietario cambia el plan y da una prueba temporal (administración de datos).
set local role postgres;
update public.tenants set plan = 'pro' where id = current_setting('t.ta')::uuid;
insert into public.tenant_features (tenant_id, feature_key, enabled, source, expires_at)
values (current_setting('t.ta')::uuid, 'new_editor', true, 'trial', now() + interval '1 day');

set local role authenticated;
select ok((select enabled from public.tenant_effective_features where feature_key = 'macros_calculator'),
  '26a: el addon incluido en el plan está activo');
select ok((select enabled from public.tenant_effective_features where feature_key = 'new_editor'),
  '26b: la excepción del tenant está activa');

set local role postgres;
update public.tenant_features set expires_at = now() - interval '1 minute'
where tenant_id = current_setting('t.ta')::uuid and feature_key = 'new_editor';
update public.features set is_enabled = false where key = 'demo_core';

set local role authenticated;
select ok(not (select enabled from public.tenant_effective_features where feature_key = 'new_editor'),
  '27a: una excepción caducada deja de estar activa');
select ok(not (select enabled from public.tenant_effective_features where feature_key = 'demo_core'),
  '27b: el interruptor general apaga el flag para todos');

set local role postgres;
select * from finish();
rollback;
