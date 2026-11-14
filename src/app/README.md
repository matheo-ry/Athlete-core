# src/app

El marco de la app: arranque, rutas y la "carcasa" de cada perfil.

- `providers.tsx`: proveedores globales (datos, idioma, sesión, tenant, flags, marca).
- `router.tsx`: monta las rutas base y las que aportan los módulos activos, con las guardas por sesión (`core/auth`) y por rol (`core/tenancy`).
- `coach/`, `client/`, `public/`: una carpeta por zona. Las de coach y cliente no se importan entre sí.
- En la raíz, lo común a las carcasas: `RootLayout`, `RootRedirect` (adónde lleva "/"), `RouteErrorPage` (lo que se ve si una pantalla falla), `BrandMark`, `BrandBadge`, `ShellNavLink`, `SignOutButton`, `useShellNav` y `useActiveModules`.
- También en la raíz, lo que comparten el perfil del cliente y los ajustes del coach: `AccountSection` ("Mi cuenta", PR 1.13) y `MySpacesSection` ("Mis espacios", PR 1.14), con `SpaceList` y `useChooseSpace`, que usa también el selector.
- **Qué no va aquí:** pantallas ni lógica de una función (van en `src/modules/`) ni piezas reutilizables (van en `src/core/`).
- `app/` importa de `core/` y del registro `modules/index.ts`, nunca de un módulo concreto (lo comprueba ESLint).
