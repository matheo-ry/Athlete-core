-- =====================================================================
-- Migración 10: el flag del módulo exercises (Fase 2, PR 2.3)
--
-- Cada módulo añade su flag cuando se crea (ARQUITECTURA §15). No fue en
-- la migración 8 porque el test 04 exige un flag por módulo del producto,
-- y el módulo llega en este PR (D-089). Es de tipo core: activo para
-- todos los negocios, sin apuntarlo en ningún plan (D-019).
-- =====================================================================

insert into public.features (key, kind, description) values
  ('exercises', 'core', 'Biblioteca de ejercicios del coach: lista, buscador y filtros (módulo exercises).');
