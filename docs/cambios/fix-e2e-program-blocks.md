# fix-e2e-program-blocks — test de bloques estable

- **Fecha:** 2026-11-23
- **PR:** pendiente de número (rama `test/estabilizar-program-blocks`)

## Qué cambió

`e2e/program-blocks.spec.ts` › "añade bloques, les pone duración, los ordena y se guardan así" fallaba a ratos (en el CI pasaba al segundo intento, y con el rediseño falló 3 de 4 veces). Ahora, antes de escribir en un bloque, el test espera a que ese bloque sea el elegido en pantalla (`aria-current`), y tras "Change" espera a que salga "8-day cycle". No cambia nada de la app.

## La causa

El bloque elegido vive en la dirección (`?block=3`). Al pulsar "Empty block", `BlockBar` hace dos cosas: añade el bloque al borrador (`useReducer`, se pinta enseguida) y cambia la dirección (`setSearchParams`). React Router pinta ese cambio de dirección dentro de una transición de React, que se puede retrasar y que cada evento nuevo (como el `fill`) interrumpe. Durante ese rato la lista ya tiene 3 bloques pero el elegido sigue siendo el 2, así que el test escribía los 8 días y las 2 vueltas en el **bloque 2**. Con la CPU ocupada (CI, rediseño) el rato era lo bastante largo para que pasara casi siempre.

Comprobado con un volcado del estado en cada paso: justo tras "Empty block" la dirección ya decía `block=3` y el botón con `aria-current` seguía siendo el 2. La misma carrera estaba al final del test: tras recargar se pulsaba el bloque 1 y enseguida su primer día, que podía ser aún el del bloque anterior.

Cómo se reproduce: frenar la CPU del navegador con CDP (`Emulation.setCPUThrottlingRate`, 4 veces) en una copia del test. Con el test antiguo falla 4 de 4; con el nuevo pasa 6 de 6. Sin freno, `--repeat-each=5 --workers=1` pasa 20 de 20 (los 4 tests del archivo).

## Decisiones

### D-fix-e2e-program-blocks-1 · El arreglo va en el test, no en la app
- **Decisión:** el test espera a lo visible (el bloque elegido y el texto del ciclo) en vez de cambiar cómo la app elige el bloque.
- **Por qué:** la pantalla nunca miente: lo que se edita es siempre el bloque que se ve elegido. El retraso solo dura unos milisegundos con un móvil normal y una persona no escribe tan rápido; el test sí. Cambiarlo en la app (por ejemplo, guardar el bloque elegido en el estado del editor además de en la dirección, o cambiar la dirección con `flushSync`) tocaría el diseño del editor (D-079, dirección `?block=&day=`) para un caso que no ve nadie.
- **Revisar si:** algún coach cuenta que, al añadir un bloque en un móvil lento, lo que escribe cae en el bloque anterior.

## Lo que debe saber el siguiente

- En el editor de rutinas, después de pulsar algo que cambia de bloque o de día (añadir, duplicar, mover, elegir), espera a `aria-current` del bloque antes de escribir. Contar los bloques (`toHaveCount`) no basta: la lista cambia antes que la selección.
- Para cazar esperas que faltan en un e2e, frenar la CPU con `page.context().newCDPSession(page)` y `Emulation.setCPUThrottlingRate` en una copia temporal del test destapa la carrera casi siempre.

## Deuda

- El aviso de `docs/ESTADO.md` sobre este test (y `archive.spec.ts`, que también pasó al segundo intento en el CI) se puede quitar o actualizar en el próximo PR de resumen del lote. `archive.spec.ts` no se ha mirado aquí.
