# core/supabase

Cliente de Supabase (solo con la clave pública) y los tipos generados de la base de datos (`database.types.ts`, se regenera con `npm run db:types` y no se edita a mano). Solo se importa desde carpetas `api/`.

La sesión se guarda en el dispositivo con la clave `athlete-core.auth` y se renueva sola. No se leen sesiones de la dirección de la página, porque los emails llevan un código y no un enlace (DECISIONES D-039).
