# AGENTS.md — Reglas del proyecto

> Fuente única de reglas para cualquier agente de IA y para las personas del equipo.
> Si una regla choca con lo que te piden, **para y pregunta**.
> Máximo 12.000 caracteres (límite de Antigravity). El detalle va en `docs/`.

## 1. Qué es esto

**ATHLETE CORE** es una app para **coaches de gimnasio (foco en fuerza)** y sus clientes.

- Una sola app: web, iOS y Android con el mismo código. Los entrenos se empiezan y se registran solo en la app del móvil; la web sirve para todo lo demás.
- El **coach** crea rutinas y sigue a sus clientes. El **cliente** entra con el código de su coach, ve la marca de su coach y registra sus entrenos.
- Cada coach es un **tenant** (un negocio aislado). Los datos de un coach jamás se ven desde otro.

Equipo: el **propietario** (decide y aprueba), un **colaborador junior** y agentes de IA.

## 2. Antes de escribir código, lee (en este orden)

1. `CONTEXTO.md`: resumen de la app y en qué punto está.
2. Este archivo entero.
3. `docs/ESTADO.md`: en qué fase estamos y qué toca.
4. `docs/ARQUITECTURA.md`: dónde va cada cosa.
5. `docs/GUIA-GIT.md`: cómo se guardan y se suben los cambios.
6. El `README.md` del módulo que vayas a tocar.
7. Lista `docs/cambios/` y mira `git log -15` y `gh pr list`: lo último está ahí (D-153).

Cada chat empieza sin memoria: lo que debe saber el siguiente queda escrito en el archivo de `docs/cambios/` de tu PR, no solo en la conversación.

`docs/DECISIONES.md` (hasta D-153) y `docs/cambios/` (desde D-153) explican el porqué de cada decisión. Búscalas en los dos antes de proponer cambiar algo.

## 3. Reglas de oro (no negociables)

1. **Aislamiento de datos.** Toda tabla de negocio lleva `tenant_id NOT NULL` y RLS activado con políticas. Las únicas excepciones están listadas en ARQUITECTURA §8.
2. **La seguridad vive en la base de datos, no en la pantalla.** Ocultar un botón no es seguridad; la política RLS sí.
3. **Cero secretos en el repositorio.** Nada de claves en el código ni en commits. Solo `.env.local` (ignorado por Git) y `.env.example` sin valores. La clave `service_role` de Supabase nunca aparece en `src/`.
4. **Cero código para un cliente concreto.** Prohibido `if (tenant.id === '...')` y similares. Lo que cambia por coach va en configuración: marca, flags y plan.
5. **Una carpeta por función.** El código de una función vive en `src/modules/<función>/`. Respeta las fronteras de importación de ARQUITECTURA §6.
6. **La estructura de la base de datos solo cambia con migraciones** en `supabase/migrations/` (tablas, columnas, políticas, funciones). Nunca a mano desde el panel de Supabase. Una migración ya fusionada en `main` no se edita: se crea otra.
7. **Ningún texto visible escrito directamente en el código.** Todo pasa por i18n, en inglés y en español.
8. **Todo cambio queda en Git.** Commits pequeños y frecuentes; al terminar, `git status` limpio. Nunca se trabaja ni se hace push sobre `main`.
9. **Zonas protegidas:** `src/core/`, `supabase/`, `.github/`, archivos de configuración de la raíz, `AGENTS.md` y `docs/ARQUITECTURA.md`. Solo se tocan si la tarea lo pide expresamente. El colaborador junior necesita aprobación del propietario.
10. **Nada de dependencias nuevas por tu cuenta.** Si hace falta una librería, proponla, espera el OK y anótala en tu archivo de `docs/cambios/`.
11. **No se hace trampa con las comprobaciones.** Prohibido borrar o saltar tests, desactivar reglas de lint, usar `any`, `@ts-ignore` o `--no-verify` para que algo "pase".
12. **Producción no se toca.** Agentes y colaborador trabajan en local y en staging. Solo el propietario despliega y aplica migraciones en producción. Ningún agente enlaza la CLI de Supabase con el proyecto de producción ni usa sus claves.
13. **Ante la duda en algo irreversible, pregunta.** Borrar datos, cambios destructivos del esquema, reescribir el historial de Git, tocar pagos o permisos. Tampoco ejecutes sin permiso comandos que borran trabajo: `git reset --hard`, `git clean`, borrar ramas remotas.

## 4. Normas de código

### Idioma

- Código (variables, funciones, archivos, tablas, columnas): **inglés**.
- Comentarios, documentación, commits y Pull Requests: **español**.
- Textos de la app: claves i18n con `en` y `es`.

### TypeScript

- Modo `strict`. Prohibido `any`: usa `unknown` y valida.
- Todo dato que entra de fuera (formularios, Supabase, almacenamiento, URL) se valida con **Zod** en la frontera. Los tipos salen del esquema (`z.infer`).
- Los tipos de la base de datos los genera Supabase en `src/core/supabase/database.types.ts`. No se editan a mano.
- Exportaciones con nombre. Nada de `export default`, salvo que una herramienta lo exija.
- Funciones pequeñas y con un solo propósito. Si un archivo pasa de unas 250 líneas, divídelo.

### Nombres

| Qué | Formato | Ejemplo |
|---|---|---|
| Componentes y sus archivos | PascalCase | `ProgramCard.tsx` |
| Pantallas | PascalCase + `Page` | `ProgramListPage.tsx` |
| Hooks | camelCase con `use` | `useProgramList.ts` |
| Resto de archivos y carpetas | kebab-case | `program-schema.ts` |
| Tablas y columnas | snake_case, tablas en plural | `workout_sessions.performed_at` |
| Claves i18n | `modulo.zona.elemento` | `programs.editor.saveButton` |
| Feature flags | snake_case | `macros_calculator` |

### React

- Componentes funcionales con hooks. Un componente por archivo.
- Las pantallas solo componen piezas. La lógica va en hooks y en `model/`.
- **Los componentes nunca llaman a Supabase.** Solo los archivos de `api/` hablan con la base de datos; los componentes usan los hooks definidos allí (TanStack Query).
- Estado del servidor: TanStack Query. Estado local: `useState` o `useReducer`. Estado global: el mínimo, con los contextos de `core/`.
- Toda pantalla con datos trata 4 estados: cargando, vacío, error y con datos.
- Estilos con Tailwind y los componentes de `core/ui`. Los colores salen siempre de las variables de tema, nunca de un hex fijo: la marca la pone cada coach.
- Accesibilidad básica: etiquetas en los formularios, botones de verdad (`<button>`) y zonas táctiles de 44 px o más.

### Datos y formatos

- Fechas en UTC en la base de datos (`timestamptz`). Se convierten a la zona del usuario al mostrarlas.
- Pesos guardados **siempre en kg**. Se muestran en kg o lb según la preferencia del usuario (`core/lib/units`).
- Dinero en céntimos (entero) más código de moneda.
- Identificadores: `uuid`.

### Errores y registro

- Nada de `catch` vacío. Al usuario se le muestra un mensaje traducido y el error se registra con el logger de `core/lib`.
- Nada de `console.log` en código fusionado.
- En los logs no se escriben datos personales (emails, nombres, medidas). En tests, datos de ejemplo y capturas, solo datos inventados.

### Comentarios

- Explica el **porqué**, no el qué. Cada módulo, un `README.md` corto.

## 5. Base de datos (resumen; detalle en ARQUITECTURA §8)

Cada tabla nueva de negocio incluye, en la misma migración:

- `tenant_id uuid not null` con clave foránea, y `unique (tenant_id, id)`.
- Claves foráneas **compuestas** `(tenant_id, …)` hacia otras tablas de negocio.
- `enable row level security`, permisos (`grant`) explícitos y políticas por rol.
- Índices que empiecen por `tenant_id`.
- Un test de aislamiento en `supabase/tests/`: un usuario de otro tenant no puede leer ni escribir.

Plantilla: `docs/referencia/plantilla-tabla-negocio.sql`.

## 6. Tests

| Cambio | Test obligatorio |
|---|---|
| Lógica pura (`model/`, `core/lib`) | Unitario (Vitest) |
| Tabla o política nueva | Aislamiento RLS (pgTAP) |
| Flujo crítico nuevo (login, unirse con código, asignar rutina, registrar entreno) | Extremo a extremo (Playwright) |
| Arreglo de un bug | Un test que falle sin el arreglo |

Los tests van junto al archivo que prueban: `units.ts` → `units.test.ts`.

## 7. Git (resumen; detalle en GUIA-GIT.md)

- Una tarea = una rama = un Pull Request. Ramas: `tipo/descripcion-corta`.
- Commits con formato Conventional Commits y en español: `feat(programs): añadir duplicar semana`.
- Commit después de cada paso que funcione. Push al terminar la sesión.
- El título del Pull Request sigue el mismo formato que un commit: es el mensaje que quedará en `main`.
- Antes de pedir revisión: `npm run check` en verde.
- **Fusionar (D-148):** Claude no fusiona: con el CI en verde dice "PR N listo para fusionar" y termina; fusiona el chat de fusión (Haiku 5.5, PROMPTS §0). Gemini fusiona los suyos con el CI en verde y un comentario "VISTO BUENO DE CLAUDE". Lo crítico de D-148 (producción, borrar datos, relajar RLS o permisos, pagos, secretos, historial de Git, reglas de oro, decisiones suyas) necesita el OK del propietario escrito en el prompt; si no está, para y pregunta. Nunca `push --force`.
- **Reparto (D-142, D-144):** cada agente decide lo de sus PR con criterio propio y lo deja escrito como D-xxx; solo pregunta lo irreversible (regla 13). Gemini puede tocar cualquier carpeta y añadir librerías; lo que contradiga una decisión lo propone en el PR. Claude revisa antes de fusionar todo PR que toque `supabase/`, RLS o permisos.
- **Chats en paralelo (GUIA-GIT §15):** cada chat en su worktree y su rama; nunca dos PR a la vez sobre la misma carpeta de módulo ni la misma base local.
- **Documentación por tarea (D-153):** cada PR añade un archivo en `docs/cambios/`. Al cerrar cada lote, un solo PR de Claude lo resume en `CONTEXTO.md` y `docs/ESTADO.md`.

## 8. Cómo trabaja un agente en una tarea

1. Lee lo indicado en §2 y la tarea. Si falta algo importante, pregunta **todo junto al principio**. Después trabaja de forma autónoma hasta terminar.
2. Crea la rama desde `main` actualizado.
3. Cambia **solo** lo que pide la tarea. No refactorices lo que no toca, no actualices dependencias y no añadas funciones "de regalo". Si ves algo mejorable, anótalo como deuda en tu archivo de `docs/cambios/`.
4. Haz commits pequeños mientras avanzas.
5. Ejecuta `npm run check` y arregla lo que falle, sin trampas (regla 11). Si falla algo ajeno, no lo tapes: dilo.
6. Añade UN archivo nuevo `docs/cambios/<tarea>-<nombre>.md` (plantilla en `docs/cambios/README.md`) con fecha, qué cambió, decisiones `D-<tarea>-<n>`, lo que debe saber el siguiente y deuda. **No toques** `CONTEXTO.md`, `docs/ESTADO.md`, `docs/DECISIONES.md` ni las marcas "hecho" de PROMPTS §7: una tarea está hecha si su archivo está en `main` (D-153).
7. Deja `git status` limpio, haz push y abre el Pull Request con la plantilla.
8. Termina con un resumen: qué cambió, cómo probarlo paso a paso, qué queda pendiente y qué dudas tienes.

## 9. Definición de "terminado"

- [ ] Hace lo que pedía la tarea, y nada más.
- [ ] `npm run check` pasa (formato, lint, tipos, tests y build).
- [ ] Textos en `en` y `es`.
- [ ] Probado como coach y como cliente, en ancho de móvil y de escritorio.
- [ ] Tablas nuevas con RLS y test de aislamiento.
- [ ] Archivo nuevo en `docs/cambios/` (sin tocar CONTEXTO, ESTADO ni DECISIONES).
- [ ] Todo en commits, `git status` limpio y Pull Request abierto.

## 10. Glosario

| Palabra | Significado |
|---|---|
| Tenant | El negocio de un coach. |
| Espacio | Pertenencia de un usuario a un tenant, con su rol (lo que ve en la app). |
| Rol | `owner` (el coach dueño), `staff` (otro coach del mismo negocio; previsto, todavía sin alta) o `client`. |
| Perfil coach | Lo que ven `owner` y `staff`: rutas `/coach/...`. |
| Perfil cliente | Lo que ve `client`: rutas `/client/...`. |
| Módulo | Una función de la app en su carpeta: `src/modules/<función>/`. |
| Manifest | Ficha de un módulo: rutas, menú y flag. |
| Flag | Interruptor de una función para un tenant. |
| RLS | Reglas de Postgres que filtran las filas de cada usuario. |
| Migración | Archivo SQL que cambia la base de datos. |
| Staging | Entorno de pruebas en la nube, con datos inventados. |
| PR | Pull Request: la petición de fusionar una rama en `main`. |
