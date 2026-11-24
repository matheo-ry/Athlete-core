# Staging: migración 22 (`progress_flag`)

- **Fecha:** 2026-11-24
- **Proyecto:** `athlete-core-staging` (ref `udlqahiitcjsnldypqal`). Producción no se ha tocado.
- **Qué se aplicó:** solo `20261117130000_progress_flag.sql` (migración 22), con `supabase db push --remote --yes`. Antes, `supabase db push --remote --dry-run` mostró que era la única pendiente.
- **Comprobación previa:** `supabase link --project-ref udlqahiitcjsnldypqal`. Es el único proyecto que la sesión de la CLI ve.

## Resultado de `supabase test db` contra staging

Primera pasada, sin contraseña: `01` a `19` ok; `20_progress_flag.test.sql` falló con `function plan(integer) does not exist`. La CLI entra con un usuario temporal que no ve pgTAP en el esquema `extensions` (`supabase/README.md`, guía de staging).

Segunda pasada, con la contraseña de la base de datos de staging en una variable de entorno de la sesión (no escrita en ningún archivo):

- Los 20 archivos ok, **526 tests**, `Result: PASS`.

## Para el siguiente

- El archivo `supabase/.temp/project-ref` lo crea `supabase link` y está ignorado por Git. No se sube.
- La migración 22 está aplicada en staging. No se ha tocado nada más.
- Deuda: la CLI avisa de que `--linked` queda obsoleto (usar `--remote`), y pide `--yes` en modo agente.
