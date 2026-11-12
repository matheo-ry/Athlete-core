# Módulo `_template`

Módulo de ejemplo con la forma fija de un módulo (ARQUITECTURA §5). No es una función del producto: sirve para copiarlo con `npm run new:module <nombre>`.

- **Qué hace:** muestra una lista de ejemplo en la zona del coach y en la del cliente, pasando por los 4 estados de una pantalla con datos (cargando, vacío, error y con datos).
- **Tablas que usa:** ninguna. `api/` devuelve datos inventados.
- **Estado:** solo se registra en desarrollo (`src/modules/index.ts`). No llega a producción.

Al copiarlo para un módulo real: sustituye los datos falsos de `api/` por consultas a Supabase, rellena este README (qué hace, qué tablas usa, en qué estado está) y añade el módulo al registro.
