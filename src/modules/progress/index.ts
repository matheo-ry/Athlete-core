// Lo ÚNICO que se puede importar desde fuera del módulo (ARQUITECTURA §5).
export { progressModule } from './manifest';
export { useClientProgress } from './api/useClientProgress';
export type {
  ExerciseProgressItem,
  ExerciseSessionHistory,
  ProgramProgressGroup,
} from './model/exercise-history';
