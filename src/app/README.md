# src/app

El marco de la app: arranque, rutas y la "carcasa" de cada perfil.

- `providers.tsx`: proveedores globales (datos, idioma, sesión, tenant, flags, marca).
- `query-client.ts` y `query-persistence.ts`: la caché de datos (TanStack Query). En la app del móvil se guarda en el teléfono y se recupera antes de pintar, para abrir sin conexión con lo ya cargado (D-061 y D-118); al cerrar sesión se guarda vacía. En el navegador no se guarda.
- `router.tsx`: monta las rutas base y las que aportan los módulos activos, con las guardas por sesión (`core/auth`) y por rol (`core/tenancy`).
- `coach/`, `client/`, `public/`: una carpeta por zona. Las de coach y cliente no se importan entre sí.
- En la raíz, lo común a las carcasas: `RootLayout`, `RootRedirect` (adónde lleva "/"), `RouteErrorPage` (lo que se ve si una pantalla falla), `BrandMark`, `BrandBadge` (el logo del negocio o, si no tiene o no carga, sus iniciales), `ShellNavLink`, `SignOutButton` (con entrenos sin subir, pregunta antes, D-118), `useShellNav` y `useActiveModules`.
- También en la raíz, lo que comparten el perfil del cliente y los ajustes del coach: `AccountSection` ("Mi cuenta", PR 1.13) y `MySpacesSection` ("Mis espacios", PR 1.14), con `SpaceList` y `useChooseSpace`, que usa también el selector.
- **Qué no va aquí:** pantallas ni lógica de una función (van en `src/modules/`) ni piezas reutilizables (van en `src/core/`).
- `app/` importa de `core/` y del registro `modules/index.ts`, nunca de un módulo concreto (lo comprueba ESLint).
