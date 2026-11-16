// Genera el archivo de la app de Android para pruebas (APK de pruebas), que
// apunta a STAGING. Guía para el propietario: android/README.md.
//
// Uso: npm run android:build
//
// Pasos: compila la web con los valores de .env.staging.local, la copia al
// proyecto android/ (npx cap sync) y la empaqueta con Gradle. El resultado
// queda en build/athlete-core-staging.apk (build/ no se sube a Git).
//
// Se hace en Node para que funcione igual en Windows, macOS y Linux, y para
// encontrar solo el Java que trae Android Studio.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ANDROID = join(ROOT, 'android');
const APK_BUILT = join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const APK_OUT = join(ROOT, 'build', 'athlete-core-staging.apk');
const isWindows = process.platform === 'win32';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function firstExisting(paths) {
  return paths.find((path) => path !== undefined && existsSync(path));
}

/** El Java de Android Studio, si no hay JAVA_HOME. */
function findJavaHome() {
  return firstExisting([
    process.env.JAVA_HOME,
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    '/opt/android-studio/jbr',
  ]);
}

/** Las herramientas de Android que instala Android Studio la primera vez que se abre. */
function findAndroidSdk() {
  return firstExisting([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
  ]);
}

function run(title, command, options = {}) {
  console.log(`\n▶ ${title}`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch {
    fail(`Ha fallado: ${title}. Mira el mensaje de arriba (guía, apartado "Si algo falla").`);
  }
}

if (!existsSync(join(ROOT, '.env.staging.local'))) {
  fail(
    'Falta .env.staging.local, con la dirección y la clave pública de staging.\n' +
      '  Cómo crearlo: supabase/README.md, "Guía: poner en marcha staging".',
  );
}

const javaHome = findJavaHome();
if (javaHome === undefined) {
  fail('No encuentro Java. Instala Android Studio (guía, paso 1) y vuelve a probar.');
}
const androidSdk = findAndroidSdk();
if (androidSdk === undefined) {
  fail(
    'No encuentro las herramientas de Android. Abre Android Studio una vez y deja que\n' +
      '  termine de instalar lo que propone (guía, paso 1).',
  );
}
const gradleEnv = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: androidSdk };

run('Compilando la app contra staging', 'npx vite build --mode staging', { cwd: ROOT });
run('Copiando la app al proyecto de Android', 'npx cap sync android', { cwd: ROOT });
run(
  'Empaquetando el APK (la primera vez tarda varios minutos)',
  // Con la ruta completa: Windows no siempre busca programas en la carpeta actual.
  `"${join(ANDROID, isWindows ? 'gradlew.bat' : 'gradlew')}" assembleDebug`,
  { cwd: ANDROID, env: gradleEnv },
);

if (!existsSync(APK_BUILT)) {
  fail(`Gradle ha terminado, pero no encuentro ${APK_BUILT}.`);
}
mkdirSync(join(ROOT, 'build'), { recursive: true });
copyFileSync(APK_BUILT, APK_OUT);
console.log(`\n✔ Listo. El archivo de la app está en:\n  ${APK_OUT}\n`);
