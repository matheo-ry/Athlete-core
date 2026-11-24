# docs — resumen del cierre del lote 3 (D-153)

- **Fecha:** 2026-11-24
- **PR:** rama `docs/resumen-lote-3`

## Qué cambió

Solo documentación. Es el PR de cierre de lote previsto en D-153: resume `docs/cambios/` desde el 3.7 hasta el 3.9b, más el 3.12, el rediseño UX 1 a 4 y el arreglo del e2e de bloques, en `CONTEXTO.md` y `docs/ESTADO.md`. Marca como "hecho" en `docs/PROMPTS.md` §7 lo ya fusionado (3.5, 3.6, 3.7, 3.8, 3.9, 3.12, 3.16 y 3.18) y añade las filas 3.10b y 3.19 propuestas en D-ideas-10 y D-ideas-2. No cambia código, migraciones ni decisiones.

## Decisiones

Ninguna.

## Lo que debe saber el siguiente

- **Siguiente en serie:** 3.10 (Gemini), 3.11 (Gemini) y 3.17 (Gemini). Después, 3.10b (nota final, migración `workouts.note`) y 3.19 (calentamiento, migración `is_warmup`). Las dos migraciones tocan `supabase/`: las hace el chat que las lleve y las revisa Claude (D-144).
- **Pendiente que es zona protegida:** `docs/ARQUITECTURA.md` §14 debe decir que la nutrición llega después de los pilotos (D-ideas-1). No se ha tocado aquí: necesita el OK del propietario escrito en el prompt (AGENTS §9, regla 9).
- **Deuda de este resumen:** `docs/ESTADO.md` seguía marcando el aviso del e2e `program-blocks` como inestable; el arreglo está en #97. Queda por confirmar que `archive.spec.ts` (también anotado) sigue pasando.
- **Orden de fusión:** la rama de este PR no toca código; al fusionar no hay riesgo de conflicto con los PR de Gemini, que solo añaden su archivo en `docs/cambios/`.

## Deuda

- Ver el aviso sobre `exercises.spec.ts:129` en `docs/cambios/3.9a-consentimiento-salud.md`: sigue sin estar resuelto.
- `CONTEXTO.md` ronda las 85 líneas, por encima de las unas 80 previstas: en el próximo cierre de lote hay que resumirlo, no sumarle líneas.
