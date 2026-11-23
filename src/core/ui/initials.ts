/** Las iniciales de un nombre: "Carla Demo" → "CD", "ana" → "A". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters
    .map((word) => (word ?? '').charAt(0))
    .join('')
    .toLocaleUpperCase();
}
