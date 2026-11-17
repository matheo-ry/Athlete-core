-- =====================================================================
-- Flag del módulo progress (PR 3.15, D-129): historial, RM estimado y
-- récords. Tipo core: activo para todos los negocios (D-019).
-- Solo añade una fila al catálogo de flags; no crea tablas.
-- =====================================================================
insert into public.features (key, kind, description) values
  ('progress', 'core', 'Progreso del cliente: historial, RM estimado y récords (módulo progress).');
