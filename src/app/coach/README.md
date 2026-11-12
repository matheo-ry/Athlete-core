# src/app/coach

Carcasa del perfil **coach** (`/coach/...`): layout con menú lateral en escritorio y barra inferior en móvil, y la página de inicio.

- **Qué va aquí:** solo el marco. El menú se construye con los manifests de los módulos.
- **Qué no va aquí:** las pantallas de cada función. Van en `src/modules/<función>/coach/`.
- No importa nada de `src/app/client/` (lo comprueba ESLint). Lo común a las dos carcasas vive en la raíz de `src/app/`.
