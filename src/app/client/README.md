# src/app/client

Carcasa del perfil **cliente** (`/client/...`): layout pensado para móvil, con barra inferior, y la página de inicio ("Hoy").

- **Qué va aquí:** solo el marco. El menú se construye con los manifests de los módulos.
- **Qué no va aquí:** las pantallas de cada función. Van en `src/modules/<función>/client/`.
- No importa nada de `src/app/coach/` (lo comprueba ESLint). Lo común a las dos carcasas vive en la raíz de `src/app/`.
