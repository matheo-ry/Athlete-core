# Módulo `workouts`

- **Qué hace:** registrar entrenos por el cliente y revisarlos por el coach (DECISIONES D-115 a D-128). En la ficha del cliente (`/coach/clients/:id`), la pestaña "Entrenos" (PR 3.13): lista de entrenos y días faltados del más nuevo al más viejo, marcas "En curso", "Editado" y "Faltado", series en formato tipo Excel ("45×8(1) / 45×7(1)"), flecha de progreso frente a la vez anterior, duración, notas del día, set-up, cambiado y saltado, y datos de salud (peso corporal y medidas si dio consentimiento; si no, aviso).
- **Tablas:** `workouts`, `workout_exercises`, `workout_sets`, `program_missed_days`, `health_consents`, `body_weights`, `body_measurements`, `client_exercise_setups`.
- **Depende de:** `programs` y `exercises` (ARQUITECTURA §6), solo por sus `index.ts`: `useExerciseOptions` de `exercises` para nombres localizados de ejercicios.
- **Pestaña en la ficha del cliente:** aportada por `manifest.ts` a través de `clientProfileTabs` (D-109).
- **Flag:** `workouts` (tipo core, activo para todos), en la migración `20261116120000_workouts.sql`.
- **RM estimado y récords** (PR 3.15, D-129): `model/rm.ts` y `model/records.ts`, exportados en `index.ts`. Es la única fórmula de la app: `progress` y la actividad del coach la usan desde aquí.
- **Estado:** PR 3.13 (pestaña del coach en la ficha del cliente).
