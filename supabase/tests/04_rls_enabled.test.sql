-- =====================================================================
-- Comprobación del CI (caso 29 de docs/referencia/pruebas-aislamiento.sql):
-- ninguna tabla pública sin RLS y ninguna vista que se salte el RLS.
-- Si falla, la lista dice qué tabla o vista hay que arreglar.
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

select plan(3);

select is(
  array(select tablename::text from pg_tables
        where schemaname = 'public' and not rowsecurity order by 1),
  array[]::text[],
  '29: ninguna tabla pública sin RLS'
);

select is(
  array(select c.relname::text from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'v'
          and not coalesce('security_invoker=true' = any (c.reloptions), false)
        order by 1),
  array[]::text[],
  'toda vista pública usa security_invoker (respeta el RLS de sus tablas)'
);

-- Cada módulo del producto añade aquí su flag al crearse (ARQUITECTURA §15).
select is(
  array(select key from public.features order by key),
  array['clients', 'exercises', 'programs'],
  'el catálogo de flags tiene uno por módulo del producto, y nada más (ARQUITECTURA §15)'
);

select * from finish();
rollback;
