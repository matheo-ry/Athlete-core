# e2e

Tests de flujos completos con Playwright: abren la app en un navegador de verdad (Chromium) y la usan como un usuario.

- **Cómo se ejecutan:** `npm run test:e2e`. La primera vez en un ordenador hay que descargar el navegador: `npx playwright install chromium`.
- **Necesitan Supabase local** (desde el PR 1.3): `npm run db:start`, `npm run db:reset` y `.env.local` con los valores de `npx supabase status`. Entran con los usuarios inventados de `supabase/seed.sql` (`helpers.ts`).
- **Qué va aquí:** un test por flujo crítico (login, unirse con código, asignar rutina, registrar entreno) según AGENTS.md §6. `auth.spec.ts` prueba entrar y cerrar sesión; `smoke.spec.ts`, que la app arranca sin errores.
- **Qué no va aquí:** tests de lógica o de un componente suelto. Esos van con Vitest, junto al archivo que prueban.
- No forman parte de `npm run check` ni del CI hasta la Fase 3.
- Solo datos inventados.
