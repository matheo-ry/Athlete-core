// Lo ÚNICO que se puede importar desde fuera del módulo (ARQUITECTURA §5).
export { exercisesModule } from './manifest';

// Para el editor de rutinas (módulo programs, ARQUITECTURA §6): elegir un
// ejercicio sin salir de la rutina y saber el nombre y la medida de cada uno.
export { useExerciseOptions } from './api/useExerciseOptions';
export { ExercisePicker } from './coach/ExercisePicker';
export type { ExerciseOption } from './model/exercise-list';
export type { Measurement } from './model/exercise-schema';
