# PRIME 2 — Pantallas del cliente

- **Fecha:** 2026-11-23
- **PR:** pendiente (rama `feat/prime-2-cliente`, apilada sobre `feat/prime-1-sistema`)

## Qué cambió

Las pantallas del cliente estrenan PRIME (`docs/cambios/prime-1-sistema.md`) y cambia cómo se navega mientras se entrena: el entreno va a pantalla completa, el descanso flota con un anillo, y desde cualquier pantalla una píldora lleva de vuelta al entreno abierto. Rutina ("Entreno"), Progreso y Perfil con titulares grandes, cristal y controles segmentados. Sin cambios de lógica ni de datos.

## Decisiones

### D-prime2-1 · Entrenar a pantalla completa (modo foco)
- **Decisión:** `ModuleRoute` admite `immersive` (en `core/modules`); `router.tsx` lo pasa como `handle` de la ruta y `useImmersive` (en `app/`) lo lee. La ruta `workout` de `workouts` es `immersive`: la carcasa del cliente oculta la marca y la barra de navegación. Para salir: "Volver al resumen" en cada ejercicio y "Salir por ahora" en el resumen (texto nuevo `workouts.workout.leave`; el entreno sigue abierto).
- **Por qué:** en mitad de una serie, la barra de navegación solo sirve para tocarla sin querer. Es lo que hacen las apps de entreno buenas. Con `handle` la carcasa no conoce las rutas de ningún módulo: lo declara el módulo.
- **Ojo:** "Salir por ahora" y no "Volver al inicio": los e2e pulsan "Back to home" justo después de "Terminar entreno", y con dos enlaces iguales podrían pulsar el del resumen antes de que salga la pantalla final.

### D-prime2-2 · Control segmentado común
- **Decisión:** `SEGMENTED_GROUP_CLASS` y `segmentClassName(active)` en `core/ui`: una ranura de cristal con una lente en la opción elegida. Lo usan `ChoiceChips` (progreso), kg/lb, "Igual" y, en PRIME 3, las pestañas del coach.

### D-prime2-3 · "Volver" como píldora
- **Decisión:** `BackLink` en `core/ui`. Si el texto ya trae "←" (textos antiguos como "← Entreno"), quita la flecha de lo que se ve, pinta el icono y deja el texto entero como nombre accesible (los tests lo buscan así).

### D-prime2-4 · Series que se iluminan
- **Decisión:** cada serie es un panel de cristal; al hacerla se tiñe del color del coach, con un filo de luz y un tick en lugar del número. Las teclas − y + son de 44 px dentro de una ranura de 56 px; peso y repeticiones en dos columnas, RIR/RPE y "F" debajo.
- **Cifras en Mona Sans:** la utilidad `numeral` usa Mona Sans y no Hubot Sans, porque el cero de Hubot lleva un punto y "10" se podía leer "18".

### D-prime2-5 · El final del entreno, como un marcador
- **Decisión:** el resumen final va sobre la foto `chalk` a pantalla entera, con la duración, las series y los ejercicios en cifras grandes. El de empezar un día, sobre la foto del día (`photoFor`).

### D-prime2-6 · El descanso y el entreno en curso fuera de su pantalla
- **Decisión:** dentro del entreno, el descanso es una cápsula de cristal abajo con un anillo que se vacía, la cifra grande, pausar, saltar, ±15 s y los atajos. Fuera (por ejemplo, en Progreso) se encoge a una píldora encima de la barra de navegación que lleva al entreno; la alarma suena igual. Si no hay descanso pero sí un entreno abierto, `LiveWorkoutPill` (nuevo servicio de `workouts`) enseña "Continuar entreno" con las series hechas y lleva al último ejercicio tocado. No sale en el inicio (ya está el botón "Continuar entreno").
- **Por qué:** antes, si el cliente salía del entreno, no había forma visible de volver salvo desde el inicio.

## Lo que debe saber el siguiente

- `BackLink` tiene `tone="photo"` para ir encima de una foto.
- `HeroBackdrop` tiene `size` (`tall`, `short`, `screen`) en vez de `className`: `cn` no resuelve choques de alturas.
- El descanso guarda en estado el máximo que ha quedado (`peak`) para dibujar el anillo; si se empieza un descanso más corto con otro en marcha, el anillo sale a medias. El tiempo, en cambio, siempre es el correcto.
- Si el descanso está en marcha y se recarga la página, se pierde (ya pasaba: vive en memoria, D-3.7-2); entonces sale la píldora de "Continuar entreno".

## Deuda

- La píldora de entreno en curso tapa un poco el final de las listas largas: convendría sumar su alto al espacio de abajo cuando está a la vista.
- El texto `programs.client.backToProgram` y `backToDay` llevan "←" dentro: con `BackLink` sobra. Quitarlo es cambiar textos que buscan los e2e.
