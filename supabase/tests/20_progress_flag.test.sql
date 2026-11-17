-- =====================================================================
-- Flag del módulo progress (PR 3.15): existe, es core y está activo para
-- los negocios del seed.
-- =====================================================================
begin;
set local role postgres;
grant usage on schema extensions to public;
select plan(2);

select is((select kind::text from public.features where key = 'progress'), 'core',
  'el flag progress existe y es de tipo core');
select ok((select bool_and(enabled) from public.tenant_effective_features where feature_key = 'progress'),
  'progress está activo para todos los negocios');

set local role postgres;
select * from finish();
rollback;
