'use strict';

// Resolver de imports para ESLint (lo usa eslint-plugin-boundaries).
//
// Por qué existe: las fronteras de ARQUITECTURA §6 solo se pueden comprobar si
// ESLint sabe a qué archivo apunta cada import. El alias "@/" no lo entiende el
// resolver de Node, y los resolvers publicados para TypeScript no eran
// compatibles con ESLint 10 al montar el proyecto (DECISIONES D-024). Este
// archivo hace lo mínimo: traduce "@/..." y los imports relativos a un archivo
// de src/. Los paquetes de node_modules los resuelve el resolver "node".

const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const ALIAS_PREFIX = '@/';
const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '.json', '.css', '/index.ts', '/index.tsx'];

function isFile(candidate) {
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
}

exports.interfaceVersion = 2;

exports.resolve = function resolve(source, file) {
  let basePath;
  if (source.startsWith(ALIAS_PREFIX)) {
    basePath = path.join(SRC_DIR, source.slice(ALIAS_PREFIX.length));
  } else if (source.startsWith('.')) {
    basePath = path.resolve(path.dirname(file), source);
  } else {
    return { found: false };
  }

  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (isFile(candidate)) {
      return { found: true, path: candidate };
    }
  }
  return { found: false };
};
