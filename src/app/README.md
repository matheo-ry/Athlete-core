# src/app

El marco de la app: arranque, rutas y la "carcasa" de cada perfil.

- `providers.tsx`: proveedores globales (datos, idioma, tenant, flags, marca).
- `router.tsx`: monta las rutas base y las que aportan los módulos activos.
- `coach/`, `client/`, `public/`: una carpeta por zona. Las de coach y cliente no se importan entre sí.
- En la raíz, lo común a las carcasas: `RootLayout`, `RootRedirect`, `BrandMark`, `ShellNavLink`, `useShellNav`, `useActiveModules` y `DevToolbar` (selector solo de desarrollo).
- **Qué no va aquí:** pantallas ni lógica de una función (van en `src/modules/`) ni piezas reutilizables (van en `src/core/`).
- `app/` importa de `core/` y del registro `modules/index.ts`, nunca de un módulo concreto (lo comprueba ESLint).
