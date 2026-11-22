# UX 3 — Pantallas del coach

- **Fecha:** 2026-11-22
- **PR:** pendiente (rama `feat/ux-3-coach`, apilada sobre UX 2 `feat/ux-2-cliente`)

## Qué cambió

Tercer lote del rediseño (D-ux1-3): las pantallas del coach usan el sistema de UX 1, manteniendo su densidad (listas largas, editor). No cambian la lógica, los datos ni los textos.

- **Barrido común** (unos 50 archivos del coach y de `app/`): foco con `focus-ring`, títulos de pantalla grandes, esquinas `rounded-xl`, paneles internos hundidos (`rounded-2xl`), filas con hover suave y separadores tenues.
- **Control segmentado** para todas las pestañas y opciones ("Activos / Archivados", "Asignadas", pestañas de la ficha, entreno o descanso, kg o lb, claro u oscuro, RIR o RPE): `SEGMENTED_GROUP_CLASS` y `segmentClassName` en `core/ui`.
- **Campos**: `FilterSelect`, `SelectField`, `TextArea` y la nota del ejercicio del editor usan `fieldClassName` (exportado ahora desde `core/ui`).
- **Clientes**: cabecera grande; plazas como medidor (rojo y con aviso si el plan está lleno); el código de invitación en una tarjeta teñida, con el código en grande en mono y "Compartir enlace" primero; filas con avatar teñido del color del coach, chip "Nuevo" y flecha. En escritorio, plazas y código lado a lado.
- **Inicio**: actividad y avisos con avatar de iniciales (los avisos, con un punto del acento) y chip "Nuevo".
- **Ejercicios y rutinas**: etiquetas en chips, fila abierta tintada, nombre de la rutina más grande.
- **Ajustes**: muestras de color redondas y de tamaño de muestrario (antes ocupaban todo el ancho), página más estrecha, "RIR o RPE" segmentado.
- **Paneles flotantes**: la ventana de asignar, en superficie con esquinas grandes; el aviso de cambios sin guardar, en vidrio sobre la navegación.

## Decisiones

### D-ux3-1 · Rama apilada sobre UX 2
- **Decisión:** UX 3 sale de `feat/ux-2-cliente` y su PR apunta a esa rama. Al fusionar los anteriores, se retarga.
- **Por qué:** usa lo que añaden UX 1 y UX 2 (`fieldClassName`, iconos, `Pill`).

### D-ux3-2 · Densidad del coach
- **Decisión:** en las listas del coach se mantienen los separadores entre filas (más finos) en vez de una tarjeta por fila, como en el cliente.
- **Por qué:** ARQUITECTURA §7: el coach trabaja con listas largas (140 ejercicios); una tarjeta por fila las alargaría demasiado.

## Lo que debe saber el siguiente

- Para un grupo de opciones nuevo, usa `SEGMENTED_GROUP_CLASS` en el contenedor y `segmentClassName(activo)` en cada botón (con `aria-pressed`). Para un campo propio, `fieldClassName(tieneError, clasesExtra)`.
- El barrido fue con un script de un solo uso (no está en el repositorio). Si aparece algún `rounded-lg` o `focus-visible:outline-primary-readable` en el coach, es de un archivo que no estaba en la lista.
- Los e2e en paralelo tienen una carrera: `program-prescription.spec.ts` cambia a la coach de Iron Lab a kilos y la devuelve a libras, y `program-exercises.spec.ts` lee sus libras a la vez. En una pasada falló así; en serie pasan siempre. Si la coach se queda en kilos, se devuelve a libras en sus Ajustes o con `npm run db:reset`.

## Deuda

- La carrera de los e2e de unidades: cada test debería usar su propio usuario, o el de unidades no ejecutarse en paralelo.
- `FilterSelect` y `TextArea` (en `exercises`) y `SelectField` (en `programs`) siguen duplicados; ahora comparten el estilo de `core/ui`, pero convendría subir un único `Select` y un único `TextArea` a `core/ui`.
- Las pantallas de acceso (inicio de sesión, alta, unirse con código, bienvenida) quedan para UX 4.
