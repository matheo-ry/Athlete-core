# e2e

Tests de flujos completos con Playwright: abren la app en un navegador de verdad (Chromium) y la usan como un usuario.

- **Cómo se ejecutan:** `npm run test:e2e`. La primera vez en un ordenador hay que descargar el navegador: `npx playwright install chromium`.
- **Qué va aquí:** un test por flujo crítico (login, unirse con código, asignar rutina, registrar entreno) según AGENTS.md §6. En la Fase 0 solo hay un test de humo.
- **Qué no va aquí:** tests de lógica o de un componente suelto. Esos van con Vitest, junto al archivo que prueban.
- No forman parte de `npm run check` ni del CI hasta la Fase 3.
- Solo datos inventados.
