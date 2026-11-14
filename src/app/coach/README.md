# src/app/coach

Carcasa del perfil **coach** (`/coach/...`): layout con menú lateral en escritorio y barra inferior en móvil, la página de inicio (con los primeros pasos, PR 1.12) y **Ajustes** (`/coach/settings`, PR 1.13 a 1.15): "Marca", solo para el dueño (`BrandSection`, con `ColorChoice`, `ModeChoice` y `BrandPreviewCard`, que pinta un trozo de la app con la marca que se está editando), "Mis espacios" y "Mi cuenta" (en la raíz de `src/app/`), con cerrar sesión.

- **Qué va aquí:** solo el marco. El menú se construye con los manifests de los módulos.
- **Qué no va aquí:** las pantallas de cada función. Van en `src/modules/<función>/coach/`.
- No importa nada de `src/app/client/` (lo comprueba ESLint). Lo común a las dos carcasas vive en la raíz de `src/app/`.
