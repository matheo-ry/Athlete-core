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

// Peso y medidas del cliente: los lleva este módulo y `progress` los lee de aquí (D-127).
export { useClientHealthData } from './api/useClientWorkouts';
export type { ClientHealthData } from './api/workouts-coach-api';
export type { BodyMeasurementRecord, BodyWeightRecord } from './model/workout-types';
