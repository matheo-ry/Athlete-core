# EMPEZAR AQUÍ

Guía única, paso a paso, para arrancar el proyecto y para trabajar cada día con Claude y Gemini en Antigravity.

- **Parte 0.** Qué descargar.
- **Parte 1.** Preparar el repositorio (una sola vez).
- **Parte 2.** El prompt de la Fase 0, para pegar en Claude.
- **Parte 3.** Cómo trabajar con los chats después.

---

## Parte 0. Qué descargar

### Ahora

| Qué | Para qué | Dónde |
|---|---|---|
| **Git for Windows** | Guardar el historial de cambios | git-scm.com |
| **Node.js (versión LTS)** | Ejecutar y compilar la app | nodejs.org |
| **GitHub CLI** (`gh`), opcional | Crear el repositorio y los Pull Requests desde la terminal | cli.github.com |
| **Antigravity** con la extensión de Claude Code | Donde trabajan Claude y Gemini | (ya lo tienes) |
| **Este kit** | Reglas, arquitectura y prompts | `kit-app-coaches.zip` |

Después de instalar `gh`, inicia sesión una vez: `gh auth login`.

### Más adelante

| Qué | Cuándo | Dónde |
|---|---|---|
| **GitHub Student Developer Pack** (incluye GitHub Pro) | Antes de proteger `main` (Parte 1, paso 8) | education.github.com/pack |
| **Docker Desktop** | Antes de la Fase 1 (base de datos local) | docker.com |
| Cuentas de **Supabase** (staging y producción) | Fase 1 | supabase.com |
| Cuentas de desarrollador de **Apple** y **Google Play** | Fase 4 | developer.apple.com · play.google.com/console |

---

## Parte 1. Preparar el repositorio (una sola vez)

**1. Prepara la carpeta.** Descomprime el kit y pon a la carpeta el nombre del proyecto. Si aún no tienes nombre, usa uno provisional: se cambia después.

- Comprueba que dentro están también `.github`, `.gitignore` y `.gitattributes`. Empiezan por punto y a veces no se ven a la primera.
- No mezcles este kit con otra plantilla de proyecto. Si las dos traen `AGENTS.md`, `ESTADO.md` o `DECISIONES.md`, quédate con los de este kit.

**2. Rellena dos huecos** (puedes dejarlos para más tarde):

- `[NOMBRE_APP]`: busca y reemplaza en todos los archivos cuando tengas el nombre.
- `.github/CODEOWNERS`: cambia `CAMBIAR-POR-TU-USUARIO` por tu usuario de GitHub.

**3. Crea el repositorio en tu ordenador.** Abre una terminal dentro de la carpeta:

```bash
git init -b main
git add -A
git commit -m "docs: kit inicial de reglas y arquitectura"
```

Si Git te pide que te identifiques, hazlo una vez y repite el commit:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

Este es el único commit que se hace directamente en `main`. A partir de aquí, todo va por ramas.

**4. Súbelo a GitHub como repositorio privado.**

Con GitHub CLI:

```bash
gh repo create nombre-del-proyecto --private --source=. --push
```

Sin GitHub CLI: crea en la web de GitHub un repositorio privado y vacío, y después:

```bash
git remote add origin https://github.com/TU-USUARIO/nombre-del-proyecto.git
git push -u origin main
```

> **Atajo:** los pasos 3 y 4 se los puedes pedir a Claude en Antigravity. Pega: *"Lee EMPEZAR-AQUI.md y haz los pasos 3 y 4 de la Parte 1 (repositorio privado llamado nombre-del-proyecto). No hagas nada más."* Necesita que `gh` ya tenga la sesión iniciada.

**5. Abre la carpeta en Antigravity.**

- Gemini lee el `AGENTS.md` de la raíz como reglas del proyecto. La extensión de Claude lee `CLAUDE.md`, que apunta a `AGENTS.md`. Así los dos siguen las mismas reglas.
- Si tienes reglas globales (las que valen para todos tus proyectos), revisa que no digan lo contrario que este `AGENTS.md`. En este proyecto manda `AGENTS.md`.

**6. Abre un chat nuevo de Claude y pega el prompt de la Parte 2.**

- Si te enseña un plan antes de ejecutar, léelo y apruébalo.
- Si te hace preguntas al principio, contéstalas todas de una vez: después trabajará sin parar.
- Si te pide permiso para ejecutar comandos, acepta los de instalar, crear archivos, Git y `npm`. Lo que suene a borrar cosas fuera de la carpeta del proyecto, recházalo.

**7. Cuando termine:**

1. Prueba la app en tu ordenador. La carpeta estará en la rama del agente (`chore/fase-0-esqueleto`): ejecuta `npm install` y `npm run dev`.
2. Lee su resumen final y revisa el Pull Request en GitHub. Comprueba que el CI ha salido en verde.
3. Opcional: abre un chat de Gemini y pídele que revise el PR con la plantilla §4 de `docs/PROMPTS.md`.
4. Fusiona el PR con "Squash and merge".
5. Vuelve a `main` en tu ordenador: `git switch main` y `git pull`.
6. Cierra ese chat.

**8. Protege `main`** (pasos en `docs/GUIA-GIT.md` §12). Antes, pide el GitHub Student Developer Pack con tu cuenta de la universidad.

**9. Invita a tu hermano** al repositorio como colaborador. Él clona el repositorio y ejecuta `npm install` una vez: eso instala también las comprobaciones automáticas.

**10. Siguiente tarea:** el PR 1.1 de `docs/PROMPTS.md` §5, en un chat nuevo (Parte 3).

---

## Parte 2. Prompt de la Fase 0

Copia todo el texto del recuadro siguiente y pégalo en Antigravity.

```
Eres el agente de desarrollo de este repositorio.

ANTES DE NADA
1. Lee completos, en este orden: CONTEXTO.md, AGENTS.md,
   docs/ESTADO.md, docs/ARQUITECTURA.md, docs/GUIA-GIT.md y
   docs/DECISIONES.md.
2. Esos documentos mandan. Si algo de este prompt los contradice, o se
   contradicen entre sí, dímelo antes de seguir.
3. Si tienes dudas que te impidan empezar, házmelas todas juntas ahora.
   Si no, empieza y no te pares a pedir confirmación entre entregables.

TAREA: FASE 0 — ESQUELETO DEL PROYECTO

Objetivo: dejar el proyecto montado, con la estructura de carpetas, las
herramientas de calidad y las dos carcasas (coach y cliente) funcionando
con datos de ejemplo. Sin funciones de producto, sin tablas en la base de
datos y sin login real: eso es la Fase 1.

Rama: chore/fase-0-esqueleto (créala desde main).

CONDICIONES
- Esta tarea te autoriza a crear y tocar las zonas protegidas de
  AGENTS.md (regla 9) que hagan falta para montar el esqueleto.
- De la documentación solo puedes modificar README.md, CONTEXTO.md,
  docs/ESTADO.md y docs/DECISIONES.md. No cambies AGENTS.md, CLAUDE.md, EMPEZAR-AQUI.md ni
  el resto de docs/: si crees que algo debería cambiar, proponlo al final.
- La carpeta ya contiene archivos (este kit). No los borres ni los
  sobrescribas al crear el proyecto base. Si la herramienta de creación
  exige una carpeta vacía, crea el proyecto en una carpeta temporal y
  trae los archivos. Completa el .gitignore y el README.md existentes en
  lugar de sustituirlos.
- Usa las versiones estables más recientes de cada herramienta y consulta
  su documentación oficial en lugar de fiarte de tu memoria: la forma de
  configurar Tailwind, ESLint, React Router y Capacitor ha cambiado entre
  versiones.
- El equipo trabaja en Windows. Los comandos de package.json, los
  scripts y los hooks deben funcionar en Windows, macOS y Linux.
- Dependencias previstas en esta fase: react, react-dom, react-router,
  @tanstack/react-query, zod, i18next, react-i18next (y un detector de
  idioma), tailwindcss, lucide-react, @capacitor/core, @capacitor/cli,
  typescript, vite, vitest, @testing-library/react,
  @testing-library/jest-dom, @testing-library/user-event, jsdom,
  @playwright/test, eslint, typescript-eslint, eslint-plugin-react-hooks,
  eslint-plugin-boundaries, prettier, husky, lint-staged,
  @commitlint/cli, @commitlint/config-conventional y supabase (CLI).
- Puedes instalar además, sin preguntar, los complementos oficiales que
  esas herramientas necesitan para funcionar: por ejemplo, los plugins
  de React y de Tailwind para Vite, los paquetes de tipos (@types/...),
  eslint-config-prettier o @testing-library/dom. Cualquier otra librería
  nueva, pregúntamela antes de instalarla.
- No crees el cliente de Supabase ni tablas. No añadas las plataformas
  nativas de Capacitor.
- Este Pull Request es la excepción al límite de unas 300 líneas: es el
  esqueleto inicial y va en un solo PR.

ENTREGABLES
Haz al menos un commit por cada letra, con el formato de GUIA-GIT §5.

A. Proyecto base: Vite + React + TypeScript en modo estricto, con el
   alias "@/" apuntando a "src/". Fija la versión de Node en un solo
   sitio (.nvmrc y "engines" en package.json) y que el CI use esa misma.

B. Estructura de carpetas exacta de ARQUITECTURA §4 y §5, con un
   README.md de 3 a 8 líneas en cada carpeta principal que diga qué va
   dentro y qué no. Las carpetas de módulos que aún no existen
   (clients, exercises, programs, workouts, progress) NO se crean: solo
   _template.

C. Calidad:
   - ESLint (configuración plana) con TypeScript, hooks de React y las
     fronteras de ARQUITECTURA §6, incluidas la tabla de dependencias
     entre módulos y las fronteras internas de un módulo (coach/ no
     importa de client/, model/ no importa React ni Supabase, solo api/
     importa el cliente de Supabase).
   - Prohibidos por lint: any, export default (salvo donde una
     herramienta lo exija) y console.log.
   - Prettier y .editorconfig.
   - Husky: pre-commit con lint-staged; commit-msg con commitlint
     (Conventional Commits, admitiendo también el tipo "db");
     pre-push que ejecuta npm run check e impide subir la rama main
     (solo la rama: las etiquetas de versión sí se pueden subir).
   - Los hooks se instalan solos al ejecutar npm install.

D. Los comandos de npm de ARQUITECTURA §13 que apliquen a esta fase
   (todos menos los db:*). "npm run check" ejecuta, en este orden:
   format:check, lint, typecheck, test y build.

E. core/ mínimo:
   - config: variables de entorno validadas con Zod (por ahora solo
     VITE_APP_ENV) y .env.example.
   - i18n: inglés y español, idioma inicial según el dispositivo,
     cambio de idioma y carga de los textos de cada módulo.
   - ui: Button, Input, Card, Spinner, EmptyState y ErrorState,
     pintados solo con variables de tema.
   - branding: esquema Zod de la marca (ARQUITECTURA §10), función que
     la convierte en variables CSS, corrección de contraste y marca por
     defecto.
   - lib: conversión kg/lb, formato de fechas y un logger.
   - modules: el tipo ModuleManifest y defineModule.
   - flags: useFeature y FeatureGate, por ahora con datos de ejemplo.
   - tenancy: un contexto con el tenant activo y el rol del usuario,
     por ahora con datos de ejemplo. En la Fase 1 se sustituirán por
     los reales sin cambiar a quien lo usa.
   - El resto de carpetas de core/ (auth, billing, supabase, native)
     quedan solo con su README.md.

F. app/: router con las zonas de entrada, coach y cliente.
   - Carcasa de coach: menú lateral en escritorio y barra inferior en
     móvil.
   - Carcasa de cliente: barra inferior, pensada para móvil.
   - Una página de inicio de ejemplo en cada zona y una página 404.
   - La ruta "/" lleva a la zona del perfil activo.
   - El menú de cada carcasa se construye a partir de los manifests
     registrados.
   - Solo en desarrollo: un selector para ver la app como coach o como
     cliente y para cambiar entre dos marcas de ejemplo. No debe existir
     en la compilación de producción.

G. modules/_template: un módulo de ejemplo completo con la forma fija de
   ARQUITECTURA §5 (manifest, index, README, api con datos falsos, model
   con un test, pantalla de coach, pantalla de cliente, componente
   compartido e i18n en/es). Se registra solo en desarrollo.
   Además, scripts/new-module (en Node, sin comandos de bash) y el
   comando npm run new:module <nombre>, que copia _template con el
   nombre nuevo y recuerda añadirlo al registro.

H. Tests: Vitest y Testing Library configurados, con tests reales para
   la conversión kg/lb y para la marca (variables CSS y contraste).
   Playwright configurado solo con Chromium y con un test de humo: la
   app carga y se puede pasar de la zona de coach a la de cliente.
   Ejecútalo en local; en esta fase no entra en el CI.

I. Supabase: la CLI como dependencia de desarrollo y "supabase init".
   Sin migraciones. Si el comando hace preguntas, responde que no a los
   extras opcionales.

J. Capacitor: capacitor.config.ts con un identificador provisional.
   Sin plataformas nativas.

K. CI: .github/workflows/ci.yml que, en cada Pull Request y en main,
   ejecute npm ci y npm run check.

L. Documentación: completa "Cómo arrancar el proyecto" en README.md,
   marca la Fase 0 en docs/ESTADO.md, actualiza CONTEXTO.md (fase,
   última tarea, siguiente tarea, últimos cambios y "A tener en cuenta")
   y rellena "Versiones instaladas" en docs/DECISIONES.md. Si has tomado alguna decisión de diseño,
   añádela como D-0XX.

CRITERIOS DE ACEPTACIÓN
1. "npm install" y "npm run dev" arrancan la app. Con el selector de
   desarrollo se ven la zona de coach y la de cliente, en inglés y en
   español.
2. "npm run check" pasa sin errores ni avisos.
3. Un import prohibido hace fallar el lint. Demuéstralo en el resumen
   final con el mensaje de error (sin dejar el import en el código).
4. Un commit con el mensaje mal formado es rechazado. Demuéstralo igual.
5. Al cambiar de marca en el selector cambia el tema de toda la app.
6. No hay ningún texto visible escrito directamente en los componentes.
7. Los archivos del kit siguen intactos, salvo los que esta tarea
   permite modificar.
8. "git status" limpio, rama subida y Pull Request abierto con la
   plantilla y con un título en formato de commit. Si no puedes abrir
   el PR, sube la rama y dame el enlace.

AL TERMINAR, RESPÓNDEME CON
- Qué has hecho, entregable por entregable.
- Cómo lo pruebo yo, paso a paso.
- Las demostraciones de los criterios 3 y 4.
- La lista de dependencias instaladas, con una línea que diga para qué
  sirve cada una.
- Qué ha quedado pendiente o te ha generado dudas.
- Cualquier cosa de AGENTS.md o de ARQUITECTURA.md que cambiarías ahora
  que lo has montado, y por qué. No la cambies: solo proponla.
```


---

## Parte 3. Cómo trabajar con los chats después

### Un chat por tarea

- **Chat nuevo** para cada tarea nueva: una función, un arreglo, un cambio en la base de datos. Una tarea = una rama = un Pull Request = un chat.
- **El mismo chat** solo mientras sigas con esa misma tarea: corregir lo que salió en la revisión, un fallo del CI, una duda sobre lo que acaba de hacer.
- **Cuando el PR se fusiona, ese chat se cierra.**

Por qué:

- Un chat largo arrastra todo lo anterior. Gasta más uso de tu plan en cada mensaje y la IA empieza a confundir cosas viejas con nuevas.
- Lo importante no se pierde al cerrar: queda en Git y en `CONTEXTO.md`.

### `CONTEXTO.md`: el resumen para cada chat nuevo

- Está en la raíz del proyecto. Resume en una página qué es la app, en qué fase está, cuál fue la última tarea, cuál es la siguiente y los 5 últimos cambios.
- **Se actualiza solo:** las reglas obligan al agente a ponerlo al día al terminar cada tarea, en el mismo PR.
- Si alguna vez ves que se ha quedado viejo, pídele a un agente que lo actualice a partir de `docs/ESTADO.md` y del historial de Git.

### Al empezar un chat nuevo

Pega el prompt de inicio de `docs/PROMPTS.md` §0 y, debajo, la tarea. Así el agente lee `CONTEXTO.md` y `AGENTS.md` antes de tocar nada.

### Antes de cerrar un chat

Pega el prompt de cierre de `docs/PROMPTS.md` §0. Comprueba que `CONTEXTO.md` y `docs/ESTADO.md` están al día y que todo está subido.

### Claude y Gemini

- Los dos leen las mismas reglas (`AGENTS.md`).
- **Nunca trabajan a la vez en la misma rama.** Si quieres dos tareas en paralelo, que sean de módulos distintos y cada una en su rama (`docs/GUIA-GIT.md` §8).
- Buena combinación: uno construye la tarea y el otro revisa el PR con la plantilla §4 de `docs/PROMPTS.md`.
- Si uno se atasca o se te acaba su uso, el otro puede seguir la misma tarea en un chat nuevo: que lea `CONTEXTO.md`, la rama y el PR abierto.

### Rutina de cada sesión

1. `git switch main` y `git pull`.
2. Mira `CONTEXTO.md`: qué toca.
3. Chat nuevo, con el prompt de inicio y la tarea.
4. El agente trabaja, hace commits y abre el PR.
5. Pruebas la app y revisas el PR (o se lo pasas al otro agente).
6. Fusionas, prompt de cierre y cierras el chat.
