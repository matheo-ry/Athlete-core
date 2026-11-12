# src/modules

Las funciones de la app: **una carpeta por función** (ARQUITECTURA §5).

- **Qué va aquí:** todo el código de una función (pantallas de coach y de cliente, consultas, lógica y textos), dentro de `src/modules/<función>/` con la forma fija: `manifest.ts`, `index.ts`, `README.md`, `api/`, `model/`, `coach/`, `client/`, `shared/`, `i18n/`.
- **Qué no va aquí:** piezas que usan varios módulos (van a `src/core/`) ni las carcasas y rutas base (van a `src/app/`).
- `index.ts` es el registro: la lista de módulos que monta la app.
- `_template/` es el módulo de ejemplo. Para crear uno nuevo: `npm run new:module <nombre>`.
- Un módulo solo importa de `core/` y, si está en la tabla de ARQUITECTURA §6, del `index.ts` de otro módulo. Lo comprueba ESLint.
- La carpeta de cada módulo se crea cuando llega su fase (`docs/ESTADO.md`), no antes.
