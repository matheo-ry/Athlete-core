# src/test

Utilidades compartidas para los tests unitarios (Vitest + Testing Library).

- `setup.ts`: se ejecuta antes de cada archivo de test (matchers de jest-dom, idioma en inglés, limpieza).
- `render-app.tsx`: monta la app entera en una ruta, para tests de pantallas y navegación.
- **Qué no va aquí:** los tests. Cada test vive junto al archivo que prueba (`units.ts` → `units.test.ts`). Los de flujos completos van en `e2e/`.
- Solo usa datos inventados (AGENTS.md §4).
