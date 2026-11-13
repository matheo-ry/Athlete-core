const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Describe un archivo de textos: por cada clave ("nav.coach"), la lista de los
 * huecos que tiene ("{{sets}}"). Dos idiomas están completos cuando sus
 * descripciones son iguales: mismas claves y mismos huecos en cada una.
 */
export function describeTranslations(tree: unknown, prefix = ''): Record<string, string[]> {
  if (typeof tree === 'string') {
    const placeholders = [...tree.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1] ?? '');
    return { [prefix]: placeholders.sort() };
  }
  if (typeof tree !== 'object' || tree === null || Array.isArray(tree)) {
    throw new Error(`Translation "${prefix}" must be a text or a group of texts`);
  }

  const description: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(tree)) {
    Object.assign(description, describeTranslations(value, prefix ? `${prefix}.${key}` : key));
  }
  return description;
}
