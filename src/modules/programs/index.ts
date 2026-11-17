// Lo ÚNICO que se puede importar desde fuera del módulo (ARQUITECTURA §5).
export { programsModule } from './manifest';

// Para `workouts` (ARQUITECTURA §6): la rutina vigente del cliente, para
// guardarla en el móvil y entrenar sin conexión (PR 3.4b, D-118).
export { loadCurrentClientProgram } from './api/current-client-program';
export type { CurrentClientProgram } from './api/current-client-program';
export { localToday } from './model/calendar';
export { clientProgramSchema } from './model/assignments';
export type { ClientProgram } from './model/assignments';
export { programDocumentSchema } from './model/program-document';
export type { ProgramDocument } from './model/program-document';

// Para la tarjeta "Hoy toca" de `workouts` (PR 3.5, D-119).
export { useClientToday, useDaySummary, useDayTitle } from './shared/useClientToday';
export type { ClientToday } from './shared/useClientToday';
export { shortDate } from './shared/useProgressText';
export type { ProgramBlock, ProgramDay, ProgramDayExercise } from './model/program-document';
