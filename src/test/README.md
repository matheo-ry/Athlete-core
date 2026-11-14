# src/test

Utilidades compartidas para los tests unitarios (Vitest + Testing Library).

- `setup.ts`: se ejecuta antes de cada archivo de test (matchers de jest-dom, idioma en inglés, limpieza).
- `render-app.tsx`: monta la app entera en una ruta, para tests de pantallas y navegación. Por defecto hay una sesión de coach abierta; para probar sin sesión, pásale `auth: createFakeAuthService({ signedInAs: null })`.
- `fake-auth-service.ts`: un `AuthService` en memoria, sin Supabase ni red, con tres cuentas inventadas.
- `translation-shape.ts`: compara dos archivos de textos (mismas claves y mismos huecos). Lo usan los tests que exigen inglés y español.
- **Qué no va aquí:** los tests de la app. Cada test vive junto al archivo que prueba (`units.ts` → `units.test.ts`). Los de flujos completos van en `e2e/`.
- Solo usa datos inventados (AGENTS.md §4).
