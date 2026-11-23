# UX 2 — Pantallas del cliente

- **Fecha:** 2026-11-22
- **PR:** pendiente (rama `feat/ux-2-cliente`, apilada sobre UX 1 `claude/app-design-ux-improvement-886b99`)

## Qué cambió

Segundo lote del rediseño (D-ux1-3): las pantallas del cliente usan ya el sistema de UX 1. Sin cambios de lógica, de datos ni de textos.

- **Inicio:** "Hoy toca" es la tarjeta protagonista (teñida con el color del coach, el día en grande, el resumen en mono y "Iniciar entreno" de 56 px a todo lo ancho). Descanso, sin rutina y modo lista llevan su icono. La tarjeta del coach pasa al final.
- **Entreno:**
  - Resumen: el total "6/20 series" con una barra de una casilla por serie, y cada ejercicio como fila con su anillo (lleno, se ilumina y enseña un tick).
  - Ejercicio: barra de progreso por ejercicio (hecho, actual, pendiente), título grande, nota del coach con filete del acento, anterior/siguiente grandes.
  - Serie: tarjeta con el número en un círculo (tick al hacerla), lo de la vez anterior con icono de historial y "Igual" en píldora. Los datos van en baldosas de dos en dos: − y + de 44 px, la cifra grande en mono y lo de referencia atenuado. Hecha, se enciende con el color del coach.
  - Descanso: barra de vidrio que flota sobre la navegación, con la cuenta atrás grande, una barra que se vacía, pausar y saltar como botones redondos y los atajos en fila.
  - Resumen final: el motivo de órbita con trofeo y tres cifras grandes.
  - Descartar: enlace discreto que se vuelve rojo; la confirmación, en una tarjeta roja suave con el botón nuevo `variant="danger"`.
- **Rutina:** cabecera grande, "Hoy toca" destacado, los días como filas (el de hoy, encendido con un punto luminoso; los de descanso, en segundo plano con una luna), ejercicios numerados en mono y la ficha del ejercicio con baldosas por serie.
- **Progreso:** chips como control segmentado (los que no caben se deslizan de lado), "Último" y "Progreso del RM" en baldosas de cifra (`ProgressStat`), récord con trofeo, historial y detalle sin emojis.
- **Perfil:** cabecera grande, desplegable con el estilo de los campos, interruptores con desplazamiento suave y "Qué copia «Igual»" como lista segmentada.

## Decisiones

### D-ux2-1 · Rama apilada sobre UX 1
- **Decisión:** UX 2 sale de la rama de UX 1 (PR #93), no de `main`, y su PR apunta a esa rama.
- **Por qué:** necesita el sistema de diseño de UX 1, que aún no está fusionado. Al fusionar el #93, este PR se retarga a `main`.

### D-ux2-2 · Sin emojis en la interfaz
- **Decisión:** 📝 y ★ del progreso pasan a iconos del registro (`note`, `trophy`).
- **Por qué:** los emojis cambian de aspecto según el móvil y son de lo que más delata una interfaz genérica. Los iconos siguen el color de la marca.

### D-ux2-3 · Iconos nuevos en `core/ui` y botón `danger`
- **Decisión:** el registro de iconos suma `arrowRight`, `check`, `chevronLeft`, `chevronRight`, `history`, `minus`, `moon`, `note`, `pause`, `play`, `plus`, `skip`, `smartphone`, `timer` y `trophy`. `Button` suma `variant="danger"`. `StateOrbit` se exporta.
- **Por qué:** los módulos piden los iconos por nombre (no importan la librería), y `cn` no resuelve conflictos de clases, así que el rojo de "Sí, descartar" necesita su variante.

## Lo que debe saber el siguiente

- Los tests (unitarios y e2e) buscan por nombre accesible, `data-testid` y texto exacto. Antes de cambiar una pantalla, busca sus textos en `e2e/` y en los `*.test.tsx`: por ejemplo, en la rutina del cliente no puede haber dos textos "Today" exactos (el día de hoy lleva un punto, no un chip con "Today").
- `ChoiceChips` tiene un test que prohíbe la clase `surface-raised`.
- El descanso calcula su barra con el tiempo más largo visto en ese descanso; si se elige un atajo más corto, la barra no vuelve a llenarse.
- Para probar los entrenos en el navegador hace falta `VITE_ALLOW_WEB_WORKOUTS=true`. Si se empieza un entreno de prueba con un usuario del seed, hay que descartarlo: los e2e esperan que no haya ninguno abierto.
- Con el panel del navegador oculto, las animaciones de entrada se quedan a medias en las capturas; no es un fallo de la app.

## Deuda

- `/client/workout` no tiene entrada propia en la barra inferior: durante un entreno no se ilumina ninguna pestaña.
- El lastre y el RIR sin valor previo enseñan el campo vacío; un "—" atenuado se leería mejor.
- En "Progreso", los ejercicios de peso corporal sin lastre dibujan una línea plana en 0 kg: convendría otra métrica por defecto (repeticiones).
