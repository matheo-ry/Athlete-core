# docs — resumen del cierre del lote 3 (D-153)

- **Fecha:** 2026-11-24
- **PR:** #104, rama `docs/resumen-lote-3`

## Qué cambió

Solo documentación. Es el PR de cierre de lote previsto en D-153. Esta versión se integró con `main` (incluye 3.10 #105, 3.11 #106, 3.17 #107 y UX 5 #108) y resume en `CONTEXTO.md` y `docs/ESTADO.md`:

- 3.10, 3.11 y 3.17 como fusionados, con sus decisiones D-3.10-1 a 3, D-3.11-1 a 3 y D-3.17-1 a 3.
- UX 5 (#108) como última tarea terminada.
- La siguiente tarea pasa a ser el diseño de la Fase 4 — Pilotos.
- En `docs/PROMPTS.md` §7 se marca "hecho" lo fusionado: 3.10 (#105), 3.11 (#106) y 3.17 (#107), además de lo que ya estaba marcado. Quedan pendientes 3.10b y 3.19.

No cambia código, migraciones ni decisiones.

## Decisiones

Ninguna.

## Lo que debe saber el siguiente

- **Siguiente tarea:** diseño de la Fase 4 — Pilotos. Antes de la Fase 4 quedan en la Fase 3 el PR 3.10b (nota final, migración `workouts.note`, D-ideas-10) y el PR 3.19 (calentamiento, migración `is_warmup`, D-ideas-2). Las migraciones tocan `supabase/`: las hace el chat que las lleve y las revisa Claude (D-144).
- **Zona protegida pendiente:** `docs/ARQUITECTURA.md` §14 debe decir que la nutrición llega después de los pilotos (D-ideas-1). No se ha tocado aquí: necesita el OK del propietario escrito en el prompt (AGENTS §9, regla 9).
- **Orden de fusión:** este PR no toca código; no hay riesgo de conflicto con los PR de Gemini, que solo añaden su archivo en `docs/cambios/`.

## Deuda

- `exercises.spec.ts:129`: el aviso de `docs/cambios/3.9a-consentimiento-salud.md` sigue sin resolver.
- Claves i18n sin uso `app.clientHome.coachLabel` y `app.coachHome.businessLabel` (`docs/cambios/ux-5-ajustes.md`).
- UX 5: no se pasó la batería e2e completa (sí unitarios, tipos y lint de las zonas tocadas).
- `CONTEXTO.md` vuelve a estar en unas 80 líneas. En el próximo cierre de lote hay que resumirlo, no sumarle líneas.
