// Lo ÚNICO que se puede importar desde fuera del módulo (ARQUITECTURA §5).
export { exercisesModule } from './manifest';

// Para el módulo programs (ARQUITECTURA §6): en el editor, elegir un
// ejercicio sin salir de la rutina y saber el nombre y la medida de cada uno;
// en lo que ve el cliente, también sus instrucciones y su vídeo (PR 2.15). El
// cliente solo lee los ejercicios de sus rutinas (RLS, D-072).
export { useExerciseOptions } from './api/useExerciseOptions';
export { ExercisePicker } from './coach/ExercisePicker';
export type { ExerciseOption } from './model/exercise-list';
export type { Measurement } from './model/exercise-schema';
