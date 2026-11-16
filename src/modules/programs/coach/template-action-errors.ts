import type { TemplateActionResult } from '../api/useTemplates';

/** El texto de cada fallo de una acción sobre una plantilla (D-061). */
export const TEMPLATE_ACTION_ERRORS: Record<
  Exclude<TemplateActionResult['status'], 'saved'>,
  string
> = {
  offline: 'core.errors.offline',
  conflict: 'programs.form.conflict',
  limit_reached: 'programs.form.limitReached',
  archived_exercise: 'programs.form.archivedExercise',
  error: 'core.errors.unexpected',
};
