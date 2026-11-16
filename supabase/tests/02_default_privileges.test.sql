-- =====================================================================
-- Privilegios por defecto (DECISIONES D-032).
-- Demuestra que una tabla o función nueva, creada sin "grant", nace
-- cerrada: ni anon ni authenticated pueden usarla. Así, olvidarse de un
-- permiso deja la tabla cerrada, no abierta.
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

select plan(5);

-- Se crea como lo haría una migración futura que olvida el "grant".
create table public.forgotten_grant (id int primary key);
create function public.forgotten_grant_fn() returns int language sql as $$ select 1 $$;

set local role authenticated;
select throws_ok('select * from public.forgotten_grant', '42501', null,
  'authenticated no puede leer una tabla nueva sin grant');
select throws_ok('insert into public.forgotten_grant values (1)', '42501', null,
  'authenticated no puede escribir en una tabla nueva sin grant');
select throws_ok('select public.forgotten_grant_fn()', '42501', null,
  'authenticated no puede ejecutar una función nueva sin grant');

set local role anon;
select throws_ok('select * from public.forgotten_grant', '42501', null,
  'anon no puede leer una tabla nueva sin grant');
select throws_ok('select public.forgotten_grant_fn()', '42501', null,
  'anon no puede ejecutar una función nueva sin grant');
set local role postgres;
select * from finish();
rollback;
