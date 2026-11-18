# docs/cambios — un archivo por tarea (D-153)

Cada Pull Request añade **un archivo nuevo** aquí. Así dos PR en paralelo nunca editan el mismo documento y no chocan.

## Nombre

`<tarea>-<nombre>.md`, en kebab-case: `3.7-cronometro.md`, `fix-login.md`, `docs-cambios-por-tarea.md`.

## Reglas

1. Un PR = un archivo nuevo. No se edita el de otro PR; si hay que corregirlo, se hace en un archivo nuevo.
2. **Decisiones nuevas:** `D-<tarea>-<n>` (`D-3.7-1`, `D-fix-login-1`), con su porqué, dentro de este archivo. `docs/DECISIONES.md` es el histórico hasta D-153 y no se renumera.
3. **Si algo cambia o se quita:** el archivo nuevo dice "Sustituye a D-x" y, en el mismo PR, se añade una línea "Sustituida por D-y" a la decisión antigua (la única edición permitida en el histórico).
4. **Los PR normales no tocan** `CONTEXTO.md`, `docs/ESTADO.md`, `docs/DECISIONES.md` ni las marcas "hecho" de `docs/PROMPTS.md` §7. Una tarea está hecha si su archivo está en `main`.
5. **Al cerrar cada lote**, un solo PR de Claude resume `docs/cambios/` en `CONTEXTO.md` y `docs/ESTADO.md` (y marca lo hecho en PROMPTS §7).
6. **Antes de decidir algo**, busca en `docs/DECISIONES.md` y en `docs/cambios/` (`grep -ri "palabra" docs/cambios docs/DECISIONES.md`).

## Plantilla

```markdown
# <Tarea> — <nombre>

- **Fecha:** AAAA-MM-DD
- **PR:** #N (rama `tipo/descripcion`)

## Qué cambió

Dos o tres frases.

## Decisiones

### D-<tarea>-1 · <título>
- **Decisión:** …
- **Por qué:** …
- **Sustituye a:** D-x (solo si aplica)
- **Revisar si:** … (opcional)

Si no hay, "Ninguna".

## Lo que debe saber el siguiente

Trampas, cosas a medias, avisos que no están en el código.

## Deuda

Lo mejorable que viste y no tocaba. Si no hay, "Ninguna".
```
