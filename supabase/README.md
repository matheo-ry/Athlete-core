# supabase — ZONA PROTEGIDA

La base de datos del proyecto (ARQUITECTURA §8). Supabase en local necesita Docker Desktop abierto.

- `config.toml`: configuración de Supabase en local (creada con `supabase init`). Las cuentas siguen DECISIONES D-038 a D-046: hay que confirmar el email; el código es de 6 dígitos y caduca a los 15 minutos; pasan 60 segundos entre un código y el siguiente; la contraseña tiene 8 caracteres como mínimo y, para cambiarla, se pide la actual.
- `templates/`: los 4 emails de cuenta (confirmar, entrar con código, cambiar la contraseña y aviso de contraseña cambiada). Cada uno lleva el texto en inglés y en español, y elige según `user_metadata.locale`. Solo llevan el código, sin enlaces (D-039). Si cambias una plantilla o `config.toml`, reinicia Supabase local (`npm run db:stop` y `npm run db:start`).
- `migrations/`: cambios de estructura, en orden. Una migración ya fusionada en `main` no se edita: se crea otra (AGENTS.md, regla 6).
  - `20261113210000_base_schema.sql`: tablas base, funciones, permisos y RLS. Sale de `docs/referencia/esquema-base.sql`.
  - `20261114100000_accounts_and_emails.sql`: el perfil nace con los datos del registro; `accept_terms`; `email_status` (dice si un email tiene cuenta, sin sesión); el tope de intentos en el esquema `private`, que la API no expone.
  - `20261114120000_invites_and_memberships.sql`: códigos de 8 caracteres sin los que se confunden; `preview_invite` sin sesión; `join_tenant_with_code` con un resultado por caso (D-054); el tope de 10 códigos equivocados; `archive_client` y `reactivate_client` (solo el dueño, comprobando el plan); `my_spaces`; `create_tenant` con las condiciones para coaches.
  - `20261114130000_rate_limits_for_shared_networks.sql`: topes más altos para lo que se cuenta por conexión, pensando en el wifi de un gimnasio (D-065).
  - `20261114140000_clients_feature.sql`: el flag del módulo `clients`. Cada módulo nuevo añade el suyo y lo apunta en la lista del test `04_rls_enabled`.
  - `20261114150000_update_brand.sql`: `update_brand` guarda el nombre, los colores y el modo del negocio, solo el dueño y comprobando cada dato (D-057). El nombre del negocio y el de la marca cambian a la vez, y el logo se conserva. Desde aquí, `name` y `branding` ya no se cambian a mano (D-067).
  - **Ojo:** `preview_invite` y `join_tenant_with_code` devuelven `{status: …}` en vez de lanzar un error. Un error desharía también el apunte del intento fallido, y el tope de intentos no contaría.
- `tests/`: tests pgTAP de seguridad. Cada archivo va en una transacción que se deshace, con usuarios inventados.
  - `01_tenant_isolation`: un tenant no ve ni toca nada de otro; permisos de cada rol; código de invitación; límite del plan.
  - `02_default_privileges`: una tabla o función nueva sin `grant` nace cerrada (DECISIONES D-032).
  - `03_feature_flags`: cómo se calcula `tenant_effective_features`.
  - `04_rls_enabled`: falla si alguna tabla pública no tiene RLS o alguna vista se lo salta.
  - `05_accounts`: el perfil del registro, aceptar los términos, `email_status` y su tope de intentos.
  - `06_invites_and_memberships`: cada caso de unirse (D-054) y de dar de baja (D-055), el tope de intentos de los códigos, `my_spaces` y crear negocio.
  - `07_brand`: `update_brand`: solo el dueño, cada dato no válido, que no se pueda cambiar a mano y que el logo se conserve.
- `seed.sql`: 2 coaches y 6 clientes inventados. La contraseña de todos es `password123` (solo en local). Sus datos van en la cuenta, como si se hubieran registrado desde la app. Iron Lab tiene el plan lleno; la coach de Iron Lab es además clienta de Norte Strength; `fran@example.com` está dado de baja.
- **Emails en local:** no salen de tu ordenador. Se ven en la bandeja de pruebas, `http://127.0.0.1:54324`.
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
