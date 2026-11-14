# e2e

Tests de flujos completos con Playwright: abren la app en un navegador de verdad (Chromium) y la usan como un usuario.

- **Cómo se ejecutan:** `npm run test:e2e`. La primera vez en un ordenador hay que descargar el navegador: `npx playwright install chromium`.
- **Necesitan Supabase local** (desde el PR 1.3): `npm run db:start`, `npm run db:reset` y `.env.local` con los valores de `npx supabase status`. Entran con los usuarios inventados de `supabase/seed.sql` (`helpers.ts`).
- **Qué va aquí:** un test por flujo crítico (login, unirse con código, asignar rutina, registrar entreno) según AGENTS.md §6. `auth.spec.ts` prueba entrar y cerrar sesión; `email-codes.spec.ts`, recuperar la contraseña y entrar con un código por email; `signup.spec.ts`, el registro; `join.spec.ts`, la primera pantalla y unirse con código; `clients.spec.ts`, la lista de clientes y el código de invitación; `smoke.spec.ts`, que la app arranca sin errores.
- **Cuentas de prueba:** los tests que cambian una cuenta (por ejemplo, su contraseña) crean la suya con `supabase-helpers.ts` (`createConfirmedUser`) y leen los códigos de la bandeja local (`latestCode`). Así no tocan los usuarios del seed. Las cuentas `e2e-…@example.com` desaparecen con `npm run db:reset`. Quien se une a Norte Strength en un test queda dado de baja al terminar (`archiveFromNorte`), para que su plan no se llene si los tests se repiten.
- **"Demasiados intentos":** en local todas las peticiones llegan desde la misma dirección IP. Si repites los tests muchas veces seguidas, espera 10 minutos o ejecuta `npm run db:reset` (D-065). Por eso los códigos equivocados se prueban con sesión, que cuenta por usuario.
- **Qué no va aquí:** tests de lógica o de un componente suelto. Esos van con Vitest, junto al archivo que prueban.
- No forman parte de `npm run check` ni del CI hasta la Fase 3.
- Solo datos inventados.
