# supabase — ZONA PROTEGIDA

La base de datos del proyecto. En la Fase 0 solo existe la configuración local (`config.toml`, creada con `supabase init`): **todavía no hay tablas**.

- **Qué irá aquí (desde la Fase 1):** `migrations/` (cambios de estructura, en orden), `tests/` (tests de aislamiento RLS con pgTAP), `functions/` (Edge Functions) y `seed.sql` (datos inventados para desarrollo).
- **Qué no va aquí:** datos reales, copias de la base de datos ni claves.
- La estructura solo cambia con migraciones, nunca a mano desde el panel de Supabase (AGENTS.md, regla 6).
- Ningún agente enlaza esta carpeta con el proyecto de producción (AGENTS.md, regla 12).
- Para arrancar Supabase en local hace falta Docker Desktop. Los comandos `npm run db:*` se añaden en la Fase 1.
