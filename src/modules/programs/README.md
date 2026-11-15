# Módulo `programs`

- **Qué hace:** las rutinas del coach (DECISIONES D-075 a D-085). En `/coach/programs`, la lista de plantillas (PR 2.7): por orden alfabético, cada una con "Semanal" o "Ciclo de N días" (o "N bloques"), cuántos días de entreno tiene y cuándo se editó; pestañas "Activas" y "Archivadas" con su número, y buscador por nombre sin tildes ni mayúsculas.
- **Nueva plantilla:** pide el nombre y cuántos días dura el ciclo (7 por defecto). Se crea con un bloque sin fecha de fin y todos sus días de descanso (`model/program-document.ts`, `newTemplate`).
- **Renombrar, archivar y recuperar**, en cada fila (`coach/TemplateRow.tsx`). Las rutinas nunca se escriben directamente: renombrar carga la rutina entera y la guarda con `save_program`; archivar y recuperar usan `set_program_archived` (D-096). Recuperar pasa por el tope de 300 plantillas activas (D-086).
- **El documento de una rutina** (`model/program-document.ts`): el esquema Zod de la rutina completa (bloques, días, ejercicios y series) que carga y guarda el editor, con los mismos topes que la base de datos; cómo se lee de la base de datos y cómo se envía a `save_program`.
- **Datos:** `programs` y sus tablas hijas, solo de lectura (D-094), en `api/programs-api.ts`. Entre `programs` y `program_blocks` hay dos relaciones: la consulta nombra la buena (`program_blocks_tenant_id_program_id_fkey`).
- **Depende de:** `exercises` (ARQUITECTURA §6), a partir del PR 2.9.
- **El cliente no ve nada de este módulo** todavía: verá su rutina en el PR 2.15.
- **Flag:** `programs` (tipo core, activo para todos), en la migración `20261115160000_programs_feature.sql`.
- **El editor** (PR 2.8a, D-098), en `/coach/programs/<id>` (`coach/ProgramEditorPage.tsx`): el ciclo del primer bloque (1 a 28 días; con 7, de lunes a domingo) y cada día, de entreno o de descanso, con su nombre, subtítulo y lugar. El estado vive en `model/cycle-editor.ts` como lógica pura: cada cambio devuelve un documento nuevo sin tocar los ejercicios ni las series. "Guardar cambios" envía el documento entero a `save_program` y vuelve a pedir la rutina. El día abierto va en la dirección (`?day=3`).
- **Estado:** la lista de plantillas y el editor de los días. Siguiente: aviso al salir y recuperación en el dispositivo (PR 2.8b).
