# supabase — ZONA PROTEGIDA

La base de datos del proyecto. En la Fase 0 solo existe la configuración local (`config.toml`, creada con `supabase init`) y las carpetas vacías: **todavía no hay tablas**.

- `migrations/`: cambios de estructura de la base de datos, en orden. Vacía hasta el PR 1.1.
- `tests/`: tests de aislamiento (RLS) con pgTAP. Vacía hasta el PR 1.1.
- `functions/`: Edge Functions (código de servidor). Vacía por ahora.
- `seed.sql`: datos inventados para desarrollo. Sin datos por ahora.
- **Qué no va aquí:** datos reales, copias de la base de datos ni claves.
- La estructura solo cambia con migraciones, nunca a mano desde el panel de Supabase (AGENTS.md, regla 6).
- Ningún agente enlaza esta carpeta con el proyecto de producción (AGENTS.md, regla 12).
- Para arrancar Supabase en local hace falta Docker Desktop. Los comandos `npm run db:*` se añaden en el PR 1.1.
