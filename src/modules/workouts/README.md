# Módulo `workouts`

- **Qué hace:** los entrenos del cliente (DECISIONES D-116 a D-124). Se empiezan y se apuntan **solo en la app del móvil** (`canLogWorkouts()` de `core/native`). Todavía sin pantallas: llegan con el PR 3.5.
- **Guardado en el móvil** (PR 3.4b, D-118 y D-143): lo hace `shared/WorkoutsService.tsx`, un servicio del manifest (`services`) que `app/` monta con la sesión iniciada, en cualquier pantalla.
  - **Para entrenar sin cobertura** (`api/offline-snapshot-api.ts`): en el espacio activo, si es de cliente y el flag está activo, al abrir la app o volver a ella con conexión (como mucho una vez por minuto) se descarga la rutina vigente entera y, de cada ejercicio, la vez anterior, y se guarda en el teléfono (`readOfflineSnapshot`). La rutina se pide con las claves de `programs`: así "Entreno" y "Hoy toca" también la tienen sin conexión.
  - **La vez anterior** (`model/offline-snapshot.ts`, D-120): se guardan la última vez en cada día de la rutina vigente y la última en cualquier día; `previousFor` elige la del mismo día y, si no, la de cualquiera. Solo cuentan las series hechas.
  - **Subir lo pendiente** (`api/useWorkoutSync.ts`, `api/sync-workout-api.ts`): la cola de `core/native` sube los entrenos con `sync_workout`, en orden, al abrir, al volver la conexión o a la app, al encolar algo y en cada reintento. Si la base de datos responde `not_allowed` (el coach dio de baja al cliente), se avisa con "No se pudo guardar: ya no tienes acceso a …"; cualquier otra regla o dato no válido, con otro aviso. Ninguno de los dos se reintenta.
- **Tablas que usa:** `workouts`, `workout_exercises` y `workout_sets`, solo de lectura (D-138); se escriben con `sync_workout`.
- **Depende de:** `programs` (ARQUITECTURA §6), solo por su `index.ts`: `loadCurrentClientProgram` y los esquemas de la rutina.
- **Flag:** `workouts` (tipo core), en la migración `20261116120000_workouts.sql`.
- **Estado:** sin pantallas. Siguiente: apuntar un entreno (PR 3.5), que encola con `getUploadQueue().enqueue(userId, { id, kind: 'workout', tenantId, tenantName, payload })` y lee lo guardado con `readOfflineSnapshot`.
