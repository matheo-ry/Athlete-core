import { NAME_MAX_LENGTH } from './exercise-form';
import type { ExerciseInput } from './exercise-form';
import type { Exercise } from './exercise-schema';

// "Restaurar original" y "Duplicar" (D-071 y D-073). Lógica pura.

/**
 * ¿El coach ha cambiado algo de un ejercicio del catálogo? Solo entonces sale
 * "Restaurar original". El catálogo no trae instrucciones ni vídeo (D-074):
 * tenerlos también cuenta como cambio.
 */
export function isModified(exercise: Exercise): boolean {
  const { original } = exercise;
  if (original === null) {
    return false;
  }
  return (
    exercise.name !== null ||
    exercise.measurement !== original.measurement ||
    exercise.isUnilateral !== original.isUnilateral ||
    exercise.muscleGroup !== original.muscleGroup ||
    exercise.equipment !== original.equipment ||
    exercise.instructions !== null ||
    exercise.videoUrl !== null
  );
}

/** Lo que deja "Restaurar original": el nombre vacío (otra vez en el idioma de cada uno) y los datos del catálogo. */
export function restoredInput(exercise: Exercise): ExerciseInput | null {
  const { original } = exercise;
  if (original === null) {
    return null;
  }
  return { ...original, name: null, instructions: null, videoUrl: null };
}

/** La copia propia de "Duplicar": todos los datos, con el nombre que se le da (cortado a 80). */
export function copyInput(exercise: Exercise, copyName: string): ExerciseInput {
  return {
    name: copyName.trim().slice(0, NAME_MAX_LENGTH),
    measurement: exercise.measurement,
    isUnilateral: exercise.isUnilateral,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    instructions: exercise.instructions,
    videoUrl: exercise.videoUrl,
  };
}
