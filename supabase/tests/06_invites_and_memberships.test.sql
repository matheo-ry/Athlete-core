-- =====================================================================
-- Invitaciones, unirse, bajas y crear negocio (PR 1.8).
-- DECISIONES D-049 a D-052, D-054, D-055 y D-060. Cada caso de D-054 y de
-- D-055 tiene aquí su test (lo pide el PR 1.8).
--
-- Usuarios inventados: A es coach (dueña de "Coach A", plan free = 3
-- clientes); C, D, E, F y G, clientes; H, sin nada.
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

select plan(40);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-0000000000c1', 'client-c@example.test'),
  ('00000000-0000-4000-8000-0000000000d1', 'client-d@example.test'),
  ('00000000-0000-4000-8000-0000000000e1', 'client-e@example.test'),
  ('00000000-0000-4000-8000-0000000000f1', 'client-f@example.test'),
  ('00000000-0000-4000-8000-0000000000a2', 'client-g@example.test'),
  ('00000000-0000-4000-8000-0000000000b1', 'nobody-h@example.test');

-- ----- Generador de códigos (D-050) -----
select is(
  (select count(*)::int from generate_series(1, 300)
   where public.generate_invite_code() ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$'),
  300,
  'D-050: los códigos tienen 8 caracteres, sin 0, O, 1, I ni L'
);

-- ----- Crear negocio (D-049 y D-060) -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';
select throws_ok(
  $$ select public.create_tenant('Coach A', '  ') $$,
  'P0001', 'terms_required', 'D-060: crear un negocio exige aceptar las condiciones para coaches'
);
select throws_ok(
  $$ select public.create_tenant('A', 'draft-2026-11') $$,
  'P0001', 'invalid_name', 'D-049: el nombre necesita al menos 2 caracteres'
);
select throws_ok(
  $$ select public.create_tenant(repeat('x', 41), 'draft-2026-11') $$,
  'P0001', 'invalid_name', 'D-049: el nombre tiene 40 caracteres como máximo'
);
select set_config('t.ta', public.create_tenant('  Coach A  ', 'draft-2026-11')::text, true);
select is(
  (select branding from public.tenants where id = current_setting('t.ta')::uuid),
  '{"appName":"Coach A","logoPath":null,"colors":{"primary":"#2563EB","accent":"#FF7A1A"},"mode":"dark"}'::jsonb,
  'D-049: la marca nace con el nombre del negocio y los colores de ATHLETE CORE'
);
select is(
  (select meta ->> 'coach_terms_version' from public.audit_log
   where tenant_id = current_setting('t.ta')::uuid and action = 'tenant.created'),
  'draft-2026-11', 'D-060: queda apuntada la versión de las condiciones aceptadas'
);
select is(
  (select plan from public.tenants where id = current_setting('t.ta')::uuid),
  'free', 'D-049: el plan inicial es free'
);
select set_config('t.code', (select code from public.tenant_invites where is_active), true);
select set_config('t.branding', (select branding::text from public.tenants where id = current_setting('t.ta')::uuid), true);
set local role postgres;

-- ----- Vista previa sin sesión (D-051) -----
-- Como una petición real sin sesión: sin usuario, con su dirección IP.
set local request.jwt.claims to '{}';
set local request.headers to '{"x-forwarded-for":"203.0.113.50"}';
set local role anon;
select is(
  public.preview_invite(current_setting('t.code')),
  jsonb_build_object('status', 'ok', 'name', 'Coach A', 'branding', current_setting('t.branding')::jsonb),
  'D-051: sin sesión se ve el nombre y la marca del coach, y nada más'
);
select is(
  public.preview_invite(
    ' ' || lower(substr(current_setting('t.code'), 1, 4)) || '-' || substr(current_setting('t.code'), 5) || ' '
  ) ->> 'status',
  'ok', 'D-050: al escribirlo no importan las mayúsculas, los espacios ni los guiones'
);
select is(public.preview_invite('ABCDEFG2') ->> 'status', 'invalid_code', 'D-054: un código que no existe no vale');
set local role postgres;

-- Un negocio suspendido: su código deja de valer, con el mismo mensaje (D-054).
update public.tenants set status = 'suspended' where id = current_setting('t.ta')::uuid;
set local role anon;
select is(
  public.preview_invite(current_setting('t.code')) ->> 'status',
  'invalid_code', 'D-054: el código de un negocio suspendido no vale'
);
set local role postgres;
update public.tenants set status = 'active' where id = current_setting('t.ta')::uuid;

-- ----- Tope de intentos sin sesión (D-052 y D-065): 30 equivocados por conexión -----
-- Desde esta conexión ya van 2 fallos. Con 28 más se llega a 30…
set local role anon;
select is(
  (select count(*)::int from generate_series(1, 28) g
   where public.preview_invite('WRONG' || g) ->> 'status' = 'invalid_code'),
  28, 'D-065: sin sesión, hasta 30 códigos equivocados por conexión (el wifi de un gimnasio)'
);
-- …y ya no se puede probar ni siquiera el bueno.
select is(
  public.preview_invite(current_setting('t.code')) ->> 'status',
  'rate_limited', 'D-052: tras el tope, hay que esperar (también con el código bueno)'
);
set local role postgres;
set local request.headers to '{"x-forwarded-for":"198.51.100.9"}';
set local role anon;
select is(
  public.preview_invite(current_setting('t.code')) ->> 'status',
  'ok', 'D-052: otra conexión no está bloqueada'
);
set local role postgres;

-- ----- Unirse: cada caso de D-054 -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}';
select is(
  public.join_tenant_with_code(lower(current_setting('t.code'))),
  jsonb_build_object('status', 'joined', 'tenant_id', current_setting('t.ta')::uuid),
  'D-054: con un código bueno, el cliente entra'
);
select is(
  public.join_tenant_with_code(current_setting('t.code')),
  jsonb_build_object('status', 'already_member', 'tenant_id', current_setting('t.ta')::uuid),
  'D-054: si ya era cliente activo, entra directamente'
);
select is(
  public.join_tenant_with_code('ZZZZZZZ2') ->> 'status',
  'invalid_code', 'D-054: un código que no existe no vale'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';
select is(
  public.join_tenant_with_code(current_setting('t.code')) ->> 'status',
  'own_business', 'D-054: el dueño que usa su propio código lo sabe'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code'));
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}';
select is(
  public.join_tenant_with_code(current_setting('t.code')) ->> 'status',
  'plan_full', 'D-054: con el plan lleno (3 de 3), no se entra'
);
select is(
  (select count(*)::int from public.tenant_members where user_id = auth.uid()),
  0, 'D-054: con el plan lleno no se crea ninguna fila'
);

-- Tope de intentos por usuario al unirse: 10 equivocados bloquean.
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}';
select is(
  (select count(*)::int from generate_series(1, 10) g
   where public.join_tenant_with_code('NOPE' || g) ->> 'status' = 'invalid_code'),
  10, 'D-052: un usuario prueba 10 códigos equivocados'
);
select is(
  public.join_tenant_with_code(current_setting('t.code')) ->> 'status',
  'rate_limited', 'D-052: y queda bloqueado aunque ahora acierte'
);

-- ----- Dar de baja y reactivar (D-055) -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}';
select throws_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000d1') $$,
  'P0001', 'not_allowed', 'D-055: un cliente no puede dar de baja a otro'
);
select throws_ok(
  $$ update public.tenant_members set status = 'archived' where user_id = auth.uid() $$,
  '42501', null, 'D-055: nadie cambia el estado de un miembro a mano'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';
select lives_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000c1') $$,
  'D-055: la dueña da de baja a un cliente'
);
select is(
  (select count(*)::int from public.tenant_members
   where tenant_id = current_setting('t.ta')::uuid and role = 'client' and status = 'active'),
  2, 'D-055: dar de baja libera su plaza (2 de 3)'
);
select throws_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'not_found', 'D-055: no se puede dar de baja dos veces'
);
select ok(
  exists (select 1 from public.audit_log where action = 'member.archived'
          and meta ->> 'user_id' = '00000000-0000-4000-8000-0000000000c1'),
  'D-055: la baja queda apuntada'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}';
select is((select count(*)::int from public.tenants), 0, 'D-055: el cliente dado de baja deja de ver el negocio');
select is(
  public.join_tenant_with_code(current_setting('t.code')) ->> 'status',
  'archived', 'D-055: y no puede volver a entrar con el código'
);
select is(
  (select row(role, status, tenant_name, branding)::text from public.my_spaces()),
  row('client', 'archived', 'Coach A', null::jsonb)::text,
  'D-055: de un espacio dado de baja solo ve el nombre del coach'
);

-- Con su plaza libre entra G; ahora el plan está lleno y C no se puede reactivar.
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}';
select is(
  public.join_tenant_with_code(current_setting('t.code')) ->> 'status',
  'joined', 'D-055: la plaza liberada la puede ocupar otro cliente'
);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';
select throws_ok(
  $$ select public.reactivate_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'plan_limit_reached', 'D-055: reactivar comprueba el límite del plan'
);
select lives_ok(
  $$ select public.archive_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000a2') $$,
  'D-055: la dueña da de baja a otro para hacer hueco'
);
select lives_ok(
  $$ select public.reactivate_client(current_setting('t.ta')::uuid, '00000000-0000-4000-8000-0000000000c1') $$,
  'D-055: con una plaza libre, la dueña reactiva al cliente'
);
select ok(
  exists (select 1 from public.audit_log where action = 'member.reactivated'),
  'D-055: la reactivación queda apuntada'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}';
select is(
  (select row(role, status, tenant_name, branding ->> 'appName')::text from public.my_spaces()),
  row('client', 'active', 'Coach A', 'Coach A')::text,
  'my_spaces: de un espacio activo se ve también la marca'
);
select is((select count(*)::int from public.tenants), 1, 'D-055: el cliente reactivado vuelve a ver el negocio');

-- ----- my_spaces solo enseña los propios -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}';
select is((select count(*)::int from public.my_spaces()), 0, 'my_spaces: quien no tiene espacios no ve ninguno');
set local role postgres;
set local role anon;
select throws_ok('select * from public.my_spaces()', '42501', null, 'my_spaces: anon no puede pedirlos');
set local role postgres;

select * from finish();
rollback;
