# src/core — ZONA PROTEGIDA

Los cimientos: lo que usan todas las funciones de la app (sesión, tenant, marca, flags, idiomas, interfaz base, utilidades).

- **Qué va aquí:** piezas que necesitan dos o más módulos, o que definen cómo funciona la app entera.
- **Qué no va aquí:** nada de una función concreta (rutinas, ejercicios…). Eso vive en `src/modules/<función>/`.
- `core/` no importa nada de `modules/` ni de `app/` (lo comprueba ESLint).
- Solo se toca si la tarea lo pide expresamente (AGENTS.md, regla 9). El colaborador junior necesita aprobación del propietario.

Cada subcarpeta tiene su propio `README.md` de una línea.
