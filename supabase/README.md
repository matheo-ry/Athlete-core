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
  - `20261114160000_logos.sql`: el espacio `logos` de Storage (público, 2 MB como máximo, solo PNG, JPG y WebP). Cada logo va en la carpeta de su negocio (`<tenant_id>/…`) y solo su dueño sube, cambia o borra (`can_manage_logo`). `set_logo` y `remove_logo` lo apuntan en la marca o lo quitan. Los archivos se borran con la API de Storage, nunca con SQL (Supabase lo impide).
  - **Ojo:** `preview_invite` y `join_tenant_with_code` devuelven `{status: …}` en vez de lanzar un error. Un error desharía también el apunte del intento fallido, y el tope de intentos no contaría.
- `tests/`: tests pgTAP de seguridad. Cada archivo va en una transacción que se deshace, con usuarios inventados.
  - `01_tenant_isolation`: un tenant no ve ni toca nada de otro; permisos de cada rol; código de invitación; límite del plan.
  - `02_default_privileges`: una tabla o función nueva sin `grant` nace cerrada (DECISIONES D-032).
  - `03_feature_flags`: cómo se calcula `tenant_effective_features`.
  - `04_rls_enabled`: falla si alguna tabla pública no tiene RLS o alguna vista se lo salta.
  - `05_accounts`: el perfil del registro, aceptar los términos, `email_status` y su tope de intentos.
  - `06_invites_and_memberships`: cada caso de unirse (D-054) y de dar de baja (D-055), el tope de intentos de los códigos, `my_spaces` y crear negocio.
  - `07_brand`: `update_brand`: solo el dueño, cada dato no válido, que no se pueda cambiar a mano y que el logo se conserve.
  - `08_logos`: el espacio de logos; que una coach no pueda subir, cambiar ni ver archivos en la carpeta de otro negocio, ni una clienta en la de su coach; `set_logo` y `remove_logo`.
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

## Guía: poner en marcha staging (PR 1.17)

Staging es una copia de la app en la nube, con datos inventados, para probar con emails de verdad antes de producción (D-013). La sigue el propietario con un agente al lado: cada paso dice quién hace qué. **Es solo para staging.** Producción la crea y la toca solo el propietario (AGENTS.md, regla 12).

**Antes de empezar hace falta:** el dominio (P-01), una cuenta de Supabase (plan gratuito, D-063) y una cuenta de Resend (D-046).

**Contraseñas y claves:** la contraseña de la base de datos, la clave de Resend y cualquier clave secreta de Supabase van solo al panel que corresponda y a tu gestor de contraseñas. Nunca al repositorio, a un archivo que se suba ni al chat.

### 1. Crear el proyecto (tú, en el panel de Supabase)

1. En supabase.com, **New project**. Nombre: `athlete-core-staging`. Región: una de la Unión Europea, por ejemplo **Central EU (Frankfurt)** (D-060). Ojo: Londres y Zúrich no son de la Unión Europea.
2. Genera la contraseña de la base de datos con el botón del panel y guárdala en tu gestor de contraseñas.
3. Apunta tres cosas (no son secretas): el **Project ref** (el código de la dirección del panel, `…/project/<ref>`), la **Project URL** y la **publishable key** (Settings → API Keys).
4. Comprueba D-063 con el agente: que el plan es Free, cuántos proyectos activos permite, que no hay copias de seguridad recuperables (Database → Backups) y el aviso de pausa por falta de uso. Si algo ha cambiado, el agente corrige D-063.

### 2. Aplicar las migraciones y los datos inventados (tú escribes, el agente te guía)

```
npx supabase login
npx supabase link --project-ref <ref de staging>
npx supabase db push --remote --dry-run
npx supabase db push --remote --include-seed
npx supabase test db --remote
```

- `login` abre el navegador para entrar en tu cuenta de Supabase. `link` ya no pide la contraseña de la base de datos: la CLI entra con un usuario temporal.
- En la línea `Target: … · production`, "production" es el nombre que Supabase da a la rama principal de cualquier proyecto. Lo que cuenta es el nombre del proyecto: `athlete-core-staging`.
- `--dry-run` solo enseña las migraciones que se aplicarán (todas las de `migrations/`, en orden). Revisadlas juntos antes del siguiente paso.
- `--include-seed` carga `seed.sql`: los mismos coaches y clientes inventados que en local, con la contraseña `password123`. Solo en staging, nunca en producción.
- `test db --remote` pasa los tests de seguridad en staging. No deja nada: cada test se deshace al terminar. Tiene que acabar con `Result: PASS`.
- **Los tests necesitan la contraseña de la base de datos.** Con el usuario temporal de la CLI fallan todos con `function plan(integer) does not exist`: ese usuario no busca en el esquema `extensions`, donde está pgTAP. Antes de `test db --remote`, en la misma terminal de PowerShell (así la contraseña no queda escrita en el historial):

  ```
  $p = Read-Host "Contraseña de la base de datos" -AsSecureString
  $env:SUPABASE_DB_PASSWORD = [System.Net.NetworkCredential]::new("", $p).Password
  ```

- Si un comando falla con `Connection terminated unexpectedly`, es un corte puntual: repítelo.

### 3. Conectar Resend para enviar los emails (tú, con el agente)

Va antes de configurar las cuentas: en el plan gratuito, Supabase no deja cambiar las plantillas de email hasta que hay un envío propio conectado (`config push` falla con `entitlement_required`).

1. En Resend, **Domains → Add domain** con tu dominio y la región **Ireland (eu-west-1)**. Si el dominio está en Cloudflare, el botón **Auto configure** crea solos los registros DNS; si no, se copian a mano donde compraste el dominio. Espera a que salga como **Verified**.
2. Añade a mano el registro DMARC, que Resend no crea y ayuda a que los emails no caigan en spam: tipo `TXT`, nombre `_dmarc`, contenido `v=DMARC1; p=none;`.
3. En Resend, **API keys → Create API key**, con permiso **Sending access** y solo para tu dominio. Se ve una sola vez: pégala directamente en el paso siguiente.
4. En Supabase, **Authentication → Emails → SMTP Settings**, activa el envío propio:

   | Campo | Valor |
   |---|---|
   | Sender email | `no-reply@<tu dominio>` |
   | Sender name | `ATHLETE CORE` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | la API key de Resend |

5. En Supabase, **Authentication → Rate Limits**, pon el tope de emails por hora en **100** (D-046). Supabase solo deja subirlo con el envío propio activado, y `config push` no lo cambia.

### 4. Configurar las cuentas igual que en local (tú confirmas, el agente revisa)

```
npx supabase config diff
npx supabase config push
```

- `config diff` enseña qué cambiaría en staging sin tocar nada. `config push` lo aplica después de preguntarte (por defecto, "no").
- Sube lo que dice `config.toml`: contraseña de 8 caracteres como mínimo y pedir la actual para cambiarla, códigos de 6 dígitos que caducan a los 15 minutos, las 4 plantillas de email en dos idiomas (asunto y cuerpo) y el aviso de contraseña cambiada (D-038 a D-046).
- No toca el envío propio del paso 3: lo que `config.toml` no declara se queda como está.
- Después, `config diff` sigue enseñando unas pocas diferencias que no importan: el envío propio (solo está en staging), el tamaño de la cola de conexiones (`db.pooler`, no se puede subir con este comando) y `storage.vector` (no se usa).
- `site_url` es la dirección local (`http://localhost:5173`). No importa por ahora: los emails no llevan enlaces (D-039). Cuando haya web publicada (P-03), el agente añade la dirección de staging.

### 5. Probar desde tu ordenador contra staging (tú)

1. Crea en la carpeta del proyecto el archivo `.env.staging.local` (no se sube a Git) con lo que apuntaste en el paso 1:

   ```
   VITE_APP_ENV=staging
   VITE_SUPABASE_URL=<Project URL de staging>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key de staging>
   ```

2. Arranca la app contra staging con `npm run dev:staging` y ábrela en <http://localhost:5173>.
3. Comprueba los criterios del PR 1.17: te registras con tu email de verdad y el código llega en menos de un minuto; el remitente es "ATHLETE CORE" con una dirección de tu dominio; no cae en spam en Gmail ni en Outlook; llega en español o en inglés según el idioma de la app; recuperar la contraseña funciona de principio a fin.
4. Comprueba con el agente que el tope de intentos cuenta bien cada conexión (D-052). Sin sesión, escribe en la app un código de coach que no exista. Después, en el panel de Supabase, **SQL Editor**, ejecuta:

   ```sql
   select key, count(*) from private.rate_limit_hits group by key order by max(at) desc limit 5;
   ```

   En `key` tiene que salir la dirección IP pública de tu conexión. Si sale `unknown` o una dirección que no es la tuya, la app estaría contando a todo el mundo junto: el agente corrige `private.request_ip()` con una migración nueva, en este mismo PR.

### 6. Si staging se pausa

Con el plan gratuito, un proyecto que pasa una semana sin uso se pausa (D-063). En el panel de Supabase, abre el proyecto y pulsa **Restore project**: tarda un par de minutos y no se pierde nada.
