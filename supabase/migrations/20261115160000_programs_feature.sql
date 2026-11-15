-- =====================================================================
-- Migración 14: el flag del módulo programs (Fase 2, PR 2.7)
--
-- Cada módulo añade su flag cuando se crea (ARQUITECTURA §15). Como el de
-- exercises (D-089), va con el módulo y no con las tablas (D-094). Es de
-- tipo core: activo para todos los negocios, sin apuntarlo en ningún plan
-- (D-019).
-- =====================================================================

insert into public.features (key, kind, description) values
  ('programs', 'core', 'Rutinas del coach: plantillas, editor y asignar a clientes (módulo programs).');
