// Lo ÚNICO que se puede importar desde fuera del módulo (ARQUITECTURA §5).
export { workoutsModule } from './manifest';

export { calculateEstimatedRm } from './model/rm';
export type { RmCalculationInput } from './model/rm';

export { checkSetRecord, computeExerciseRecords, detectWorkoutRecords } from './model/records';
export type {
  ExerciseRecords,
  SetRecordCheck,
  SetWithRecordInput,
  WorkoutExerciseSets,
  WorkoutRecordsResult,
} from './model/records';
