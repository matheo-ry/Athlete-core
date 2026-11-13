# scripts

Scripts de ayuda del repositorio. Todos en Node (sin bash), para que funcionen en Windows, macOS y Linux.

- `new-module.mjs`: crea un módulo copiando `src/modules/_template`. Se usa con `npm run new:module <nombre>`.
- `pre-push.mjs`: lo ejecuta el hook de Git antes de subir. Impide subir `main` y lanza `npm run check`.
- `eslint-alias-resolver.cjs`: enseña a ESLint a resolver el alias `@/`, para poder comprobar las fronteras.
- `eslint-boundaries.test.mjs`: test de las fronteras de arquitectura. Pasa por ESLint imports prohibidos y permitidos; si alguien afloja `eslint.boundaries.js` o `eslint.config.js`, falla. Se ejecuta con `npm run test`.
- **Qué no va aquí:** código de la app (va en `src/`) ni migraciones (van en `supabase/`).
