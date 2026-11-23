import barBlur from './media/bar-blur.webp';
import bar from './media/bar.webp';
import chalkBlur from './media/chalk-blur.webp';
import chalk from './media/chalk.webp';
import deadliftBlur from './media/deadlift-blur.webp';
import deadlift from './media/deadlift.webp';
import dumbbellsBlur from './media/dumbbells-blur.webp';
import dumbbells from './media/dumbbells.webp';
import gripBlur from './media/grip-blur.webp';
import grip from './media/grip.webp';
import rackBlur from './media/rack-blur.webp';
import rack from './media/rack.webp';
import squatBlur from './media/squat-blur.webp';
import squat from './media/squat.webp';

/**
 * Las fotos de la app (D-prime1-3): fotografía real de Unsplash (licencia
 * libre), pasada a blanco y negro con negros profundos. El color lo pone la
 * marca del coach encima, así cada negocio ve las mismas fotos con su tono.
 * `blur` es una copia diminuta y desenfocada para fondos (pesa 1-4 KB).
 * `focus` es el punto que tiene que verse siempre al recortar.
 */
export const PHOTOS = {
  bar: { src: bar, blur: barBlur, focus: '40% 45%' },
  chalk: { src: chalk, blur: chalkBlur, focus: '45% 40%' },
  deadlift: { src: deadlift, blur: deadliftBlur, focus: '50% 55%' },
  dumbbells: { src: dumbbells, blur: dumbbellsBlur, focus: '55% 50%' },
  grip: { src: grip, blur: gripBlur, focus: '40% 35%' },
  rack: { src: rack, blur: rackBlur, focus: '50% 40%' },
  squat: { src: squat, blur: squatBlur, focus: '50% 30%' },
} as const;

export type PhotoName = keyof typeof PHOTOS;

const ROTATION: readonly PhotoName[] = ['grip', 'squat', 'deadlift', 'chalk', 'rack', 'bar'];

/**
 * Una foto estable para un número (por ejemplo, el día de la rutina): el mismo
 * día siempre con la misma foto, y días seguidos con fotos distintas.
 */
export function photoFor(seed: number): PhotoName {
  const index = Math.abs(Math.trunc(seed)) % ROTATION.length;
  return ROTATION[index] ?? 'grip';
}
