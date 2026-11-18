# docs — cambios por tarea

- **Fecha:** 2026-11-18
- **PR:** rama `docs/cambios-por-tarea`

## Qué cambió

Nace `docs/cambios/`: cada PR añade un archivo propio en vez de editar `CONTEXTO.md`, `docs/ESTADO.md` y `docs/DECISIONES.md`. Se actualizan AGENTS.md (§2, §7, §8, §9), GUIA-GIT, PROMPTS §0, la plantilla de PR, CONTEXTO y ESTADO. Con el OK del propietario escrito en el prompt para tocar `AGENTS.md` y `.github`.

## Decisiones

Es la D-153 de `docs/DECISIONES.md` (la última con número correlativo).

## Lo que debe saber el siguiente

- Los PR abiertos antes de este todavía pueden tocar CONTEXTO, ESTADO y DECISIONES: al integrar `main`, se pasa lo suyo a su archivo de `docs/cambios/`.
- Los cambios hasta el 2026-11-18 siguen en `docs/ESTADO.md` y `docs/DECISIONES.md`.

## Deuda

Ninguna.
