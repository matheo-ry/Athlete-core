# GUÍA DE GIT

Cómo se hace un cambio en la app, de principio a fin. Vale igual para el propietario, para el colaborador y para los agentes de IA.

## 1. La idea en un minuto

- `main` es la versión buena: lo que está publicado. **Nadie escribe directamente en `main`.**
- Cada tarea se hace en una **rama** aparte (una copia de trabajo).
- Mientras trabajas, guardas pasos pequeños: los **commits**.
- Al terminar, pides fusionar la rama en `main` con un **Pull Request (PR)**.
- Un robot (el CI) comprueba el PR. Si pasa y está revisado, se fusiona y se publica.

Si algo sale mal, se deshace el PR entero y `main` vuelve a estar bien.

## 2. Las 7 reglas

1. Nunca se trabaja ni se sube nada directamente a `main`.
2. Una tarea = una rama = un PR.
3. Commits pequeños y frecuentes, con mensaje claro.
4. **Todo cambio queda en un commit.** Al acabar la sesión, `git status` debe decir que no hay nada pendiente.
5. Antes de pedir revisión, `npm run check` tiene que pasar.
6. Nunca se suben secretos (ver §6).
7. Nunca `git push --force` ni `--no-verify`.

## 3. El ciclo de un cambio

### Paso 1. Ponte al día

```bash
git switch main
git pull
```

### Paso 2. Crea la rama de la tarea

```bash
git switch -c feat/duplicar-semana
```

### Paso 3. Trabaja y guarda pasos pequeños

Cada vez que algo funcione, aunque sea una parte:

```bash
git status                       # qué ha cambiado
git add -A                       # preparar todo
git commit -m "feat(programs): añadir botón de duplicar semana"
```

Al hacer commit se ejecutan solas dos comprobaciones: el formato del código y el formato del mensaje. Si alguna falla, el commit no se crea. Arregla lo que indique y repite.

### Paso 4. Comprueba todo

```bash
npm run check
```

Ejecuta formato, lint, tipos, tests y build: lo mismo que revisará el CI.

### Paso 5. Sube la rama y abre el PR

```bash
git push -u origin feat/duplicar-semana
gh pr create --web               # abre GitHub con la plantilla ya cargada
```

Sin GitHub CLI: entra en el repositorio en la web de GitHub y pulsa el botón de abrir Pull Request que aparece tras subir la rama.

- **Título del PR**: con el mismo formato que un commit (§5). Al fusionar, ese título será el mensaje que quede en `main`.
- **Descripción**: rellena la plantilla entera: qué hace, cómo probarlo y la lista de comprobación.

Al subir la rama se ejecuta sola otra comprobación (`npm run check`). Si falla, la rama no se sube: arregla lo que indique y repite.

### Paso 6. Revisión

- El CI se ejecuta solo. Si sale en rojo, se arregla en la misma rama con commits nuevos y `git push`.
- Cuando el hosting esté configurado (DECISIONES, P-03), cada PR tendrá una vista previa para probarlo desde el móvil o el ordenador. Hasta entonces se prueba en local.
- Quién revisa:

| Autor del PR | Quién lo aprueba |
|---|---|
| Colaborador junior | El propietario |
| Agente de IA | Quien lanzó al agente lo prueba; aprueba el propietario |
| Propietario | Él mismo, con la lista de comprobación y el CI en verde |

### Paso 7. Fusionar

- Se fusiona con **Squash and merge**: todos los commits del PR quedan como uno solo en `main`, con un mensaje limpio.
- Fusiona el propietario o un agente según D-148 (§8). El colaborador junior no fusiona.
- La rama se borra al fusionar.

### Paso 8. Vuelve a `main`

```bash
git switch main
git pull
git branch -d feat/duplicar-semana
```

## 4. Nombres de ramas

Formato: `tipo/descripcion-corta`, en minúsculas y con guiones.

| Tipo | Para qué | Ejemplo |
|---|---|---|
| `feat/` | Función nueva | `feat/duplicar-semana` |
| `fix/` | Arreglar un fallo | `fix/grafica-rm-vacia` |
| `db/` | Cambio en la base de datos | `db/tabla-workout-sessions` |
| `docs/` | Solo documentación | `docs/guia-git` |
| `chore/` | Configuración, herramientas, limpieza | `chore/actualizar-eslint` |
| `refactor/` | Reordenar código sin cambiar lo que hace | `refactor/separar-editor` |
| `test/` | Solo tests | `test/rls-programs` |

## 5. Mensajes de commit

Formato **Conventional Commits**, con la descripción en español:

```
tipo(ámbito): descripción corta en infinitivo
```

- **tipo**: `feat`, `fix`, `db`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`, `revert`.
- **ámbito**: el módulo o la zona. Por ejemplo `programs`, `workouts`, `core`, `auth`, `ci`.
- **descripción**: qué hace el commit, en minúsculas y sin punto final.

Ejemplos:

```
feat(programs): añadir duplicar semana
fix(progress): corregir gráfica de RM sin datos
db(workouts): crear tabla workout_sessions con RLS
test(programs): cubrir cálculo de volumen semanal
docs(estado): marcar fase 1 como terminada
chore(ci): añadir comprobación de tablas sin RLS
```

Un commit hace **una** cosa. Si para describirlo necesitas una "y", probablemente son dos commits.

## 6. Qué se guarda en Git y qué no

**Sí, siempre:**

| Qué | Ejemplos |
|---|---|
| Código y tests | Todo `src/`, `e2e/`, `scripts/` |
| Base de datos | `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql`, `supabase/functions/` |
| Tipos generados de la base de datos | `src/core/supabase/database.types.ts` |
| Configuración | `package.json`, `package-lock.json`, `tsconfig`, ESLint, Vite, Tailwind, Capacitor |
| Documentación | `AGENTS.md`, `docs/`, los `README.md` |
| CI y plantillas | `.github/` |
| Proyectos nativos | `android/`, `ios/` (cuando existan) |
| Textos e imágenes de la app | `i18n/*.json`, iconos, logos propios |
| Nombres de variables de entorno | `.env.example` (sin valores) |

**No, nunca:**

| Qué | Por qué |
|---|---|
| `.env`, `.env.local` y cualquier clave o contraseña | Quien vea el repositorio tendría acceso a todo |
| Certificados y claves de firma de las tiendas (`.jks`, `.keystore`, `.p8`, `.p12`, `.mobileprovision`) | Permiten publicar en tu nombre |
| `node_modules/`, `dist/` y carpetas de compilación | Se regeneran solas |
| Datos reales de clientes, copias de la base de datos | Privacidad |
| Capturas con datos personales | Privacidad |

Si un secreto se sube por error: **cámbialo de inmediato** en el servicio (dalo por robado), avisa al propietario y después se limpia. Borrarlo en un commit posterior no basta: sigue en el historial.

## 7. Pull Requests

- **Pequeños**: unas 300 líneas cambiadas como máximo. Si la tarea es grande, se divide en varios PR.
- **Una sola cosa** por PR. No se mezcla una función nueva con un arreglo que no tiene que ver.
- El título sigue el formato de los commits (§5): `feat(programs): añadir duplicar semana`.
- La plantilla se rellena entera. "Cómo probarlo" son pasos concretos que otra persona pueda seguir.
- El colaborador junior explica el cambio con sus palabras en 3 frases. Si no sabe explicarlo, todavía no está listo.
- Si el PR toca una zona protegida (ver AGENTS.md, regla 9), se dice en la descripción y se explica por qué.

## 8. Cómo usan Git los agentes de IA

- Un agente trabaja **en una rama y en una tarea**. Nunca en `main`.
- **Un chat por tarea.** Cuando la tarea se fusiona, ese chat se cierra y la siguiente empieza en un chat nuevo, que se pone al día leyendo `CONTEXTO.md`.
- Hace commit después de cada paso que funcione, con el formato de §5.
- Fusiona solo (D-148): Claude, sus PR con el CI en verde; Gemini, los suyos con el CI en verde y el comentario "VISTO BUENO DE CLAUDE". Siempre con "Squash and merge". Lo crítico de D-148 (producción, borrar datos, relajar RLS o permisos, pagos, secretos, historial, reglas de oro) solo con el OK del propietario escrito en el prompt.
- No borra ramas de otros y no reescribe historial (`push --force`, `rebase` sobre ramas ya subidas).
- Al terminar: `npm run check` en verde, `git status` limpio, rama subida y PR abierto. Si no puede abrir el PR, sube la rama y deja el enlace.
- Para abrir el PR desde la terminal, el agente escribe la plantilla rellena en un archivo temporal fuera del repositorio y usa `gh pr create --title "…" --body-file <archivo>`. No usa `--fill`, porque se salta la plantilla.
- **Dos agentes a la vez = dos ramas y dos carpetas.** Nunca dos agentes sobre la misma rama. Para tener una segunda carpeta de trabajo del mismo repositorio:

```bash
git worktree add ../app-tarea-b -b feat/tarea-b
```

- Para evitar choques, sigue las reglas de chats en paralelo (§15).

## 9. Cambios en la base de datos

1. Rama `db/...`.
2. Crear la migración: `npx supabase migration new nombre_descriptivo`.
3. Escribir el SQL siguiendo `docs/referencia/plantilla-tabla-negocio.sql`.
4. Probar en local: `npm run db:reset` y `npm run db:test`.
5. Regenerar tipos: `npm run db:types`. El archivo generado va en el mismo commit.
6. PR con el SQL, los tests de aislamiento y los tipos.
7. Tras fusionar, **solo el propietario** aplica la migración en staging y después en producción.

Reglas:

- Una migración ya fusionada **no se edita**. Para corregirla se crea otra.
- Nada de cambios a mano en el panel de Supabase.
- Cambios destructivos (borrar una columna o una tabla) van en dos pasos: primero el código deja de usarla y se publica; después, en otro PR, se borra.

## 10. Publicación y versiones

- **Web**: al fusionar en `main`, se publica sola (cuando el hosting esté configurado).
- **Apps móviles**: se publican cuando lo decide el propietario. Antes se marca la versión:

```bash
git switch main && git pull
git tag v0.3.0
git push origin v0.3.0
```

- Números de versión `vX.Y.Z`: sube `Z` con arreglos, `Y` con funciones nuevas y `X` con cambios grandes.

## 11. Si algo sale mal

| Problema | Qué hacer |
|---|---|
| He roto algo en mi rama y quiero volver al último commit | `git restore .` (ojo: descarta los cambios sin commit en archivos que ya existían; los archivos nuevos se quedan) |
| Me he equivocado en el mensaje del último commit o se me olvidó un archivo, y **aún no lo he subido** | `git add -A` y `git commit --amend`. Si ya está subido, no: haz un commit nuevo |
| No me deja subir la rama | O estás intentando subir `main` (no se puede: usa una rama), o `npm run check` ha fallado. Lee el mensaje y arréglalo |
| Un PR ya fusionado ha roto la app | En GitHub, botón **Revert** en ese PR. Crea un PR que lo deshace; se fusiona y listo |
| He hecho commits en `main` sin querer (sin subir) | `git switch -c tipo/descripcion` (te llevas los commits a una rama) y luego `git branch -f main origin/main` |
| Mi rama se ha quedado vieja respecto a `main` | En tu rama: `git fetch origin` y `git merge origin/main` |
| Hay conflictos | Pide al agente: "resuelve los conflictos de esta rama con `main` y explícame qué has elegido en cada uno". Revisa antes de hacer commit |
| El commit es rechazado | Lee el mensaje: o el formato del mensaje no cumple §5, o el lint ha encontrado un fallo. Se arregla; no se salta |
| He subido un secreto | Ver el final de §6 |

Nunca se arregla nada con `git push --force` sobre `main`.

## 12. Configuración inicial (una sola vez)

1. Repositorio **privado** en GitHub. El colaborador se añade con permiso de escritura, no de administrador.
2. Proteger `main` en la configuración del repositorio (reglas de ramas):
   - exigir Pull Request para fusionar;
   - exigir que el CI pase;
   - exigir revisión de los responsables del código (CODEOWNERS);
   - bloquear `push --force` y el borrado de la rama;
   - permitir solo "Squash merge" y borrar la rama al fusionar;
   - permitir que el propietario (administrador) se salte la revisión obligatoria en **sus propios** PR. Sin esto no podría fusionar su trabajo, porque nadie puede aprobar su propio PR. El CI no se salta nunca.

   Hazlo después de fusionar el PR de la Fase 0: el CI tiene que haberse ejecutado al menos una vez para poder marcarlo como obligatorio.
3. En repositorios privados, proteger ramas y exigir revisión de CODEOWNERS requiere un plan de pago de GitHub. El **GitHub Student Developer Pack** incluye GitHub Pro gratis para estudiantes verificados: solicítalo con tu cuenta de la universidad.
4. Mientras no esté activa la protección, el repositorio lleva un seguro local: un "hook" que impide subir a `main` desde el ordenador (se instala en la Fase 0). Los hooks se instalan solos al ejecutar `npm install`: cada persona que clone el repositorio debe ejecutarlo una vez.
5. Poner tu usuario de GitHub en `.github/CODEOWNERS`.
6. Las claves de staging y de producción se guardan como secretos del repositorio en GitHub, nunca en archivos.

## 13. Chuleta

```bash
git switch main && git pull             # empezar: ponerse al día
git switch -c feat/nombre-corto         # rama nueva para la tarea
git status                              # ver qué ha cambiado
git add -A && git commit -m "feat(x): …"  # guardar un paso
npm run check                           # comprobar todo
git push -u origin feat/nombre-corto    # subir la rama (primera vez)
git push                                # subir (siguientes veces)
gh pr create --web                      # abrir el PR con la plantilla
git switch main && git pull             # tras fusionar: volver a main
git branch -d feat/nombre-corto         # borrar la rama local
git log --oneline -10                   # ver los últimos 10 commits
```

## 14. Trampas del entorno (Windows)

En el ordenador del proyecto la terminal es Windows PowerShell 5.1. Esto ya ha fallado alguna vez:

- **No reescribas archivos con `Get-Content -Raw` + `Set-Content`.** Leen UTF-8 como ANSI y escriben con BOM: estropean todas las tildes. Edita con la herramienta de edición del agente; si usas PowerShell, `Out-File` y `Set-Content` siempre con `-Encoding utf8`.
- **`git commit -F -` con un here-string no funciona.** Escribe el mensaje en un archivo temporal fuera del repositorio y usa `git commit -F <archivo>`.
- **`gh … --jq '…'` con comillas dentro se rompe en PowerShell.** Hazlo desde Git Bash.
- **`npm run check`, `npm run test` y `git push` (su hook lanza `npm run check`) se ejecutan desde PowerShell**, no desde Git Bash: desde Git Bash todos los archivos de Vitest fallan con "Vitest failed to find the runner" sin que el código tenga nada mal. `git commit`, `gh` y los `npm run db:*` sí van bien desde Git Bash.
- **El texto "NativeCommandError"** que PowerShell pone alrededor de la salida de `git` o `npx` no significa que haya fallado: mira el resultado real (`git status`, `git log`).
- **Con el portátil en batería** los tests van unas 4 veces más lentos y muchos fallan por tiempo agotado. Si fallan por tiempo tests que no has tocado, mira la batería (`Get-CimInstance Win32_Battery`: `BatteryStatus` 1 = descargando, 2 = enchufado) y pide que se enchufe. Nunca `--no-verify` ni subir los tiempos de los tests. Dos servidores de desarrollo abiertos también ralentizan.
- **Si fallan por tiempo agotado los primeros tests de muchos archivos** (y el portátil está enchufado), es que este ordenador no da abasto con todos los archivos de Vitest a la vez (usa uno por núcleo). Ejecuta con menos a la vez, también para el push: `$env:VITEST_MAX_WORKERS = '3'` en la misma ventana de PowerShell, antes de `npm run check` o `git push`. Solo cambia cuántos archivos van en paralelo: no salta ningún test ni cambia sus tiempos.

## 15. Chats en paralelo

Lección del 2026-11-17: tres PR crearon a la vez `src/modules/workouts` y dos chats chocaron en la base de datos local. Desde entonces:

1. **Cada chat en su worktree y su rama.** Nunca dos chats en la misma rama ni en la misma carpeta de trabajo (§8).
2. **Nunca en paralelo dos PR que creen o cambien la misma carpeta de módulo o los mismos archivos.** Si una carpeta aún no existe, la crea un solo PR y los demás esperan a que se fusione. Qué carpetas toca cada PR de la Fase 3 está en `docs/PROMPTS.md` §7.
3. **La base de datos local es una sola** para todos los worktrees. Dos chats que necesiten `npm run db:reset`, `npm run db:test` o los tests e2e no van a la vez. Si un test falla por tiempo o por la base, se repite con el otro chat parado antes de culpar al código.
4. **Al empezar**, el chat ejecuta `gh pr list` y `git worktree list`. Si su tarea toca archivos de otro PR abierto, lo dice y para.
5. **Cuando se fusiona algo en `main`**, cada rama abierta integra `main` con un merge (`git fetch origin main` y `git merge origin/main`; nunca `rebase` ni `push --force`) antes de pedir revisión. En los conflictos de `CONTEXTO.md` y `docs/ESTADO.md` se conserva lo de los dos lados.
6. **Un chat que fusiona PR avisa al propietario** de qué otras ramas abiertas quedan detrás de `main` (`gh pr list` y, para cada una, `git log --oneline <rama>..origin/main`).
