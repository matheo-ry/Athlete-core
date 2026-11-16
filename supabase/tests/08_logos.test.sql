-- =====================================================================
-- El logo del negocio (PR 1.16, D-051 y D-057): el espacio "logos" de
-- Storage, quién puede subir o cambiar cada archivo, y set_logo.
--
-- Usuarios inventados: A es dueña de "Coach A"; B, dueña de "Coach B"; C,
-- clienta de A.
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

select plan(19);

-- Cuántas filas cambia una sentencia, con el RLS del usuario del momento.
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

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000008a1', 'logo-a@example.test'),
  ('00000000-0000-4000-8000-0000000008b1', 'logo-b@example.test'),
  ('00000000-0000-4000-8000-0000000008c1', 'logo-c@example.test');

-- ----- El espacio -----
select is(
  (select row(public, file_size_limit, allowed_mime_types)::text
   from storage.buckets where id = 'logos'),
  row(true, 2097152::bigint, array['image/png', 'image/jpeg', 'image/webp'])::text,
  'D-057: el espacio de logos es público, de 2 MB como máximo y solo PNG, JPG o WebP'
);

-- ----- Preparación -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008a1","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.code_a', (select code from public.tenant_invites where is_active), true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008b1","role":"authenticated"}';
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008c1","role":"authenticated"}';
select public.join_tenant_with_code(current_setting('t.code_a'));

-- ----- Subir un archivo -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008a1","role":"authenticated"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('logos', current_setting('t.ta') || '/logo.png') $$,
  'la dueña sube el logo a la carpeta de su negocio'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('logos', current_setting('t.tb') || '/logo.png') $$,
  '42501', null, 'no puede subirlo a la carpeta de otro negocio'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('logos', 'sin-carpeta.png') $$,
  '42501', null, 'ni fuera de la carpeta de un negocio'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008c1","role":"authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('logos', current_setting('t.ta') || '/otro.png') $$,
  '42501', null, 'la clienta no puede subir el logo de su coach'
);

-- ----- Otra coach no toca el logo ajeno -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008b1","role":"authenticated"}';
select is(
  pg_temp.affected_rows($$
    update storage.objects set name = current_setting('t.tb') || '/robado.png'
    where bucket_id = 'logos' and name = current_setting('t.ta') || '/logo.png'
  $$),
  0, 'otra coach no puede cambiar el logo de un negocio ajeno'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'logos'),
  0, 'ni lo ve en su lista de archivos'
);

set local role anon;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('logos', current_setting('t.ta') || '/anon.png') $$,
  '42501', null, 'sin sesión no se sube nada'
);

-- ----- set_logo -----
set local role authenticated;
select throws_ok(
  $$ select public.set_logo(current_setting('t.ta')::uuid, current_setting('t.ta') || '/logo.png') $$,
  'P0001', 'not_allowed', 'otra coach no puede poner el logo de un negocio ajeno'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008a1","role":"authenticated"}';
select throws_ok(
  $$ select public.set_logo(current_setting('t.ta')::uuid, current_setting('t.tb') || '/logo.png') $$,
  'P0001', 'invalid_path', 'solo un archivo de la carpeta de su negocio'
);
select throws_ok(
  $$ select public.set_logo(current_setting('t.ta')::uuid, current_setting('t.ta') || '/../x/logo.png') $$,
  'P0001', 'invalid_path', 'ni una ruta con trucos'
);
select throws_ok(
  $$ select public.set_logo(current_setting('t.ta')::uuid, null) $$,
  'P0001', 'invalid_path', 'set_logo siempre pide un archivo (quitarlo es remove_logo)'
);
select lives_ok(
  $$ select public.set_logo(current_setting('t.ta')::uuid, current_setting('t.ta') || '/logo.png') $$,
  'la dueña pone su logo'
);
select is(
  (select branding ->> 'logoPath' from public.tenants where id = current_setting('t.ta')::uuid),
  current_setting('t.ta') || '/logo.png',
  'queda apuntado en la marca'
);
select lives_ok(
  $$ select public.remove_logo(current_setting('t.ta')::uuid) $$,
  'la dueña quita su logo'
);
select is(
  (select branding -> 'logoPath' from public.tenants where id = current_setting('t.ta')::uuid),
  'null'::jsonb,
  'sin logo, la marca lo deja en null (se ven las iniciales)'
);

set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008c1","role":"authenticated"}';
select throws_ok(
  $$ select public.remove_logo(current_setting('t.ta')::uuid) $$,
  'P0001', 'not_allowed', 'la clienta no puede quitar el logo de su coach'
);

-- ----- Borrar, solo con la API de Storage -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000008a1","role":"authenticated"}';
select throws_ok(
  $$ delete from storage.objects where bucket_id = 'logos' $$,
  null, null, 'borrar un archivo con SQL no se puede: se hace con la API de Storage'
);
select is(
  public.can_manage_logo('no-es-un-negocio/logo.png'),
  false, 'una ruta sin el id de un negocio no es de nadie'
);
set local role postgres;
select * from finish();
rollback;
