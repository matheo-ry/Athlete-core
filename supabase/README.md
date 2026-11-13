# supabase — ZONA PROTEGIDA

La base de datos del proyecto (ARQUITECTURA §8). Supabase en local necesita Docker Desktop abierto.

- `config.toml`: configuración de Supabase en local (creada con `supabase init`).
- `migrations/`: cambios de estructura, en orden. Una migración ya fusionada en `main` no se edita: se crea otra (AGENTS.md, regla 6).
  - `20261113210000_base_schema.sql`: tablas base, funciones, permisos y RLS. Sale de `docs/referencia/esquema-base.sql`.
- `tests/`: tests pgTAP de seguridad. Cada archivo va en una transacción que se deshace, con usuarios inventados.
  - `01_tenant_isolation`: un tenant no ve ni toca nada de otro; permisos de cada rol; código de invitación; límite del plan.
  - `02_default_privileges`: una tabla o función nueva sin `grant` nace cerrada (DECISIONES D-032).
  - `03_feature_flags`: cómo se calcula `tenant_effective_features`.
  - `04_rls_enabled`: falla si alguna tabla pública no tiene RLS o alguna vista se lo salta.
- `seed.sql`: 2 coaches y 5 clientes inventados. La contraseña de todos es `password123` (solo en local).
- `functions/`: Edge Functions (código de servidor). Vacía por ahora.
- **Qué no va aquí:** datos reales, copias de la base de datos ni claves.
- La estructura solo cambia con migraciones, nunca a mano desde el panel de Supabase.
- Ningún agente enlaza esta carpeta con el proyecto de producción (AGENTS.md, regla 12).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run db:start` / `db:stop` | Arranca o para Supabase local |
| `npm run db:reset` | Borra la base de datos local y la recrea con las migraciones y `seed.sql` |
| `npm run db:test` | Ejecuta los tests de `tests/` |
| `npm run db:types` | Regenera `src/core/supabase/database.types.ts` (va en el mismo commit que la migración) |

Al escribir un test nuevo: cada archivo crea pgTAP y da permiso de ejecución a sus funciones dentro de la transacción, porque las funciones nuevas nacen sin permisos (D-032). Copia la cabecera de un test existente.
