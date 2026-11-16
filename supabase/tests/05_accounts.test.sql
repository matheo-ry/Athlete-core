-- =====================================================================
-- Cuentas (PR 1.2): el perfil nace con los datos del registro, aceptar
-- los términos, comprobar si un email tiene cuenta y su tope de intentos.
-- DECISIONES D-040, D-043, D-052, D-058 y D-060.
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

select plan(24);

-- ----- El perfil nace con los datos del registro -----
insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'full@example.test',
   '{"display_name":"  Ana Registro  ","locale":"es","weight_unit":"lb","terms_version":"draft-2026-11"}', now()),
  ('00000000-0000-4000-8000-0000000000a2', 'odd@example.test',
   jsonb_build_object('display_name', repeat('x', 100), 'locale', 'fr', 'weight_unit', 'stone', 'terms_version', '   '), null),
  ('00000000-0000-4000-8000-0000000000a3', 'empty@example.test', null, null);

select is(
  (select display_name from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'Ana Registro', 'el nombre del registro llega al perfil, sin espacios sobrantes'
);
select is(
  (select locale || '/' || weight_unit from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'es/lb', 'el idioma y la unidad del registro llegan al perfil'
);
select is(
  (select terms_version from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'draft-2026-11', 'la versión de los términos aceptados queda guardada'
);
select isnt(
  (select terms_accepted_at from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1'),
  null, 'y también la fecha en que se aceptaron'
);
select is(
  (select char_length(display_name) from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a2'),
  60, 'un nombre demasiado largo se recorta a 60 caracteres en vez de impedir el registro'
);
select is(
  (select locale || '/' || weight_unit from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a2'),
  'en/kg', 'un idioma o una unidad no admitidos pasan a los valores por defecto'
);
select is(
  (select terms_accepted_at from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a2'),
  null, 'una versión de términos vacía no cuenta como aceptada'
);
select is(
  (select display_name || '|' || locale || '|' || weight_unit from public.profiles
   where user_id = '00000000-0000-4000-8000-0000000000a3'),
  '|en|kg', 'sin datos del registro, el perfil nace con los valores por defecto'
);

-- ----- email_status: sin sesión -----
set local request.headers to '{"x-forwarded-for":"203.0.113.10, 10.0.0.1"}';
set local role anon;
select is(public.email_status('full@example.test'), 'confirmed', 'anon: email con cuenta confirmada');
select is(public.email_status('odd@example.test'), 'unconfirmed', 'anon: email con cuenta sin confirmar');
select is(public.email_status('nobody@example.test'), 'none', 'anon: email sin cuenta');
select is(public.email_status('  FULL@Example.TEST '), 'confirmed', 'no importan las mayúsculas ni los espacios');
select is(public.email_status(''), 'none', 'un email vacío no tiene cuenta');
select is(public.email_status(null), 'none', 'sin email, tampoco');

-- ----- Tope: 60 comprobaciones cada 10 minutos por conexión (D-065) -----
-- Ya van 6 desde 203.0.113.10. Se hacen 54 más (60 en total)…
select is(
  (select count(*)::int from generate_series(1, 54) g where public.email_status('x' || g || '@example.test') = 'none'),
  54, 'hasta 60 comprobaciones por conexión funcionan (el wifi de un gimnasio, D-065)'
);
-- …y la siguiente se bloquea.
select throws_ok(
  $$ select public.email_status('full@example.test') $$,
  'P0001', 'rate_limited', 'la comprobación 61 desde la misma conexión se bloquea'
);
set local role postgres;

set local request.headers to '{"x-forwarded-for":"198.51.100.7"}';
set local role anon;
select is(public.email_status('full@example.test'), 'confirmed', 'otra conexión no está bloqueada');
set local role postgres;

-- ----- El esquema del tope no es accesible desde la app -----
set local role anon;
select throws_ok('select * from private.rate_limit_hits', '42501', null, 'anon no puede leer el registro de intentos');
set local role postgres;
set local role authenticated;
select throws_ok('select * from private.rate_limit_hits', '42501', null, 'authenticated tampoco');

-- ----- Aceptar los términos -----
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}';
select lives_ok($$ select public.accept_terms('draft-2026-11') $$, 'un usuario con sesión acepta los términos');
select throws_ok(
  $$ select public.accept_terms('   ') $$,
  'P0001', 'invalid_terms_version', 'una versión vacía no se acepta'
);
select throws_ok(
  $$ update public.profiles set terms_version = 'falsa' where user_id = auth.uid() $$,
  '42501', null, 'nadie cambia la versión de los términos directamente'
);
set local role postgres;
select is(
  (select terms_version from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a2'),
  'draft-2026-11', 'accept_terms guarda la versión en el perfil del propio usuario'
);

set local role anon;
select throws_ok($$ select public.accept_terms('draft-2026-11') $$, '42501', null, 'anon no puede aceptar términos');
set local role postgres;

select * from finish();
rollback;
