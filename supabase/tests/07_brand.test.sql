-- =====================================================================
-- Guardar la marca del negocio (PR 1.15, D-057): update_brand.
--
-- Usuarios inventados: A es dueña de "Coach A"; C, clienta de A; B, dueña
-- de "Coach B".
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000007a1', 'brand-a@example.test'),
  ('00000000-0000-4000-8000-0000000007b1', 'brand-b@example.test'),
  ('00000000-0000-4000-8000-0000000007c1', 'brand-c@example.test');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007b1","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007c1","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));

-- ----- Solo el dueño -----
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, 'Hack', '#000000', '#000000', 'dark') $$,
  'P0001', 'not_allowed', 'la clienta no puede cambiar la marca de su coach'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007b1","role":"authenticated"}';
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, 'Hack', '#000000', '#000000', 'dark') $$,
  'P0001', 'not_allowed', 'otro coach no puede cambiar la marca de un negocio ajeno'
);

-- ----- El dueño, con datos válidos -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated"}';
select lives_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, '  Norte Barbell  ', '#0ea5e9', '#F59E0B', 'light') $$,
  'el dueño guarda la marca'
);
select is(
  (select row(name, branding)::text from public.tenants where id = current_setting('t.ta')::uuid),
  row(
    'Norte Barbell',
    jsonb_build_object(
      'appName', 'Norte Barbell',
      'logoPath', null,
      'colors', jsonb_build_object('primary', '#0EA5E9', 'accent', '#F59E0B'),
      'mode', 'light'
    )
  )::text,
  'D-057: el nombre del negocio y el de la marca cambian a la vez; los colores, en mayúsculas'
);
select is(
  public.preview_invite(current_setting('t.code_a')) ->> 'name',
  'Norte Barbell',
  'la vista previa del código ya enseña el nombre nuevo'
);

-- ----- Datos no válidos -----
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, ' A ', '#000000', '#000000', 'dark') $$,
  'P0001', 'invalid_name', 'un nombre de una letra no se guarda'
);
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, repeat('x', 41), '#000000', '#000000', 'dark') $$,
  'P0001', 'invalid_name', 'el nombre tiene 40 caracteres como máximo'
);
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, 'Coach A', 'red', '#000000', 'dark') $$,
  'P0001', 'invalid_color', 'un color tiene que ser como #1E5BD8'
);
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, 'Coach A', '#000000', '#12345', 'dark') $$,
  'P0001', 'invalid_color', 'el acento también se comprueba'
);
select throws_ok(
  $$ select public.update_brand(current_setting('t.ta')::uuid, 'Coach A', '#000000', '#000000', 'blue') $$,
  'P0001', 'invalid_mode', 'el modo es claro u oscuro'
);

-- ----- A mano, no -----
select throws_ok(
  $$ update public.tenants set name = 'A mano' where id = current_setting('t.ta')::uuid $$,
  '42501', null, 'ni el dueño cambia el nombre a mano'
);
select throws_ok(
  $$ update public.tenants set branding = '{}' where id = current_setting('t.ta')::uuid $$,
  '42501', null, 'ni la marca a mano: solo con update_brand'
);

-- ----- El logo se conserva (PR 1.16) y queda anotado -----
reset role;
update public.tenants
set branding = branding || jsonb_build_object('logoPath', current_setting('t.ta') || '/logo.png')
where id = current_setting('t.ta')::uuid;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated"}';
select public.update_brand(current_setting('t.ta')::uuid, 'Norte Barbell', '#111111', '#222222', 'dark');
select is(
  (select branding ->> 'logoPath' from public.tenants where id = current_setting('t.ta')::uuid),
  current_setting('t.ta') || '/logo.png',
  'cambiar los colores no quita el logo'
);

reset role;
select is(
  (select count(*)::int from public.audit_log
   where tenant_id = current_setting('t.ta')::uuid and action = 'tenant.brand_updated'),
  2,
  'cada cambio de marca queda anotado'
);

select * from finish();
rollback;
