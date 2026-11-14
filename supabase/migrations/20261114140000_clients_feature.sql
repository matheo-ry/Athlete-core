-- =====================================================================
-- Migración 5: el flag del módulo clients (Fase 1, PR 1.10)
--
-- Cada módulo añade su flag cuando se crea (ARQUITECTURA §15). Es de tipo
-- core: activo para todos los negocios, sin apuntarlo en ningún plan (D-019).
-- =====================================================================

insert into public.features (key, kind, description) values
  ('clients', 'core', 'Clientes del coach: lista, bajas y código de invitación (módulo clients).');
