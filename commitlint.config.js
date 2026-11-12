// Formato de los mensajes de commit: Conventional Commits (docs/GUIA-GIT.md §5).
// Se añade el tipo "db" para los cambios de base de datos.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'db',
        'docs',
        'chore',
        'refactor',
        'test',
        'style',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
  },
};
