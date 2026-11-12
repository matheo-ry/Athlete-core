# AGENTS.md — Reglas del proyecto

> Fuente única de reglas para cualquier agente de IA (Antigravity, Claude Code, Gemini) y para las personas del equipo.
> Si una regla choca con lo que te piden en un prompt, **para y pregunta**. No la rompas por tu cuenta.
> Este archivo debe quedar por debajo de 12.000 caracteres (límite de los archivos de reglas de Antigravity). El detalle va en `docs/`.

## 1. Qué es esto

`[NOMBRE_APP]` es una app para **coaches de gimnasio (foco en fuerza)** y sus clientes.

- Una sola app: web, iOS y Android con el mismo código.
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

Cada chat empieza sin memoria de los anteriores: lo que debe saber el siguiente tiene que quedar escrito en `CONTEXTO.md` y en `docs/ESTADO.md`, no solo en la conversación.

`docs/DECISIONES.md` explica el porqué de cada decisión. Consúltalo antes de proponer cambiar algo.

## 3. Reglas de oro (no negociables)

1. **Aislamiento de datos.** Toda tabla de negocio lleva `tenant_id NOT NULL` y RLS activado con políticas. Las únicas excepciones están listadas en ARQUITECTURA §8.
2. **La seguridad vive en la base de datos, no en la pantalla.** Ocultar un botón no es seguridad; la política RLS sí.
3. **Cero secretos en el repositorio.** Nada de claves en el código ni en commits. Solo `.env.local` (ignorado por Git) y `.env.example` sin valores. La clave `service_role` de Supabase nunca aparece en `src/`.
4. **Cero código para un cliente concreto.** Prohibido `if (tenant.id === '...')` y similares. Lo que cambia por coach se resuelve con configuración: marca, flags y plan.
5. **Una carpeta por función.** El código de una función vive en `src/modules/<función>/`. Respeta las fronteras de importación de ARQUITECTURA §6.
6. **La estructura de la base de datos solo cambia con migraciones** en `supabase/migrations/` (tablas, columnas, políticas, funciones). Nunca a mano desde el panel de Supabase. Una migración ya fusionada en `main` no se edita: se crea otra.
7. **Ningún texto visible escrito directamente en el código.** Todo pasa por i18n, en inglés y en español.
8. **Todo cambio queda en Git.** Commits pequeños y frecuentes; al terminar, `git status` limpio. Nunca se trabaja ni se hace push sobre `main`.
9. **Zonas protegidas:** `src/core/`, `supabase/`, `.github/`, archivos de configuración de la raíz, `AGENTS.md` y `docs/ARQUITECTURA.md`. Solo se tocan si la tarea lo pide expresamente. El colaborador junior necesita aprobación del propietario.
10. **Nada de dependencias nuevas por tu cuenta.** Si hace falta una librería, proponla, espera el OK y anótala en `docs/DECISIONES.md`.
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

- Explica el **porqué**, no el qué. Cada módulo tiene un `README.md` corto.

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
- Los agentes **no fusionan** Pull Requests ni hacen `push --force`.

## 8. Cómo trabaja un agente en una tarea

1. Lee lo indicado en §2 y la tarea. Si falta algo importante, pregunta **todo junto al principio**. Después trabaja de forma autónoma hasta terminar.
2. Crea la rama desde `main` actualizado.
3. Cambia **solo** lo que pide la tarea. No refactorices lo que no toca, no actualices dependencias y no añadas funciones "de regalo". Si ves algo mejorable, anótalo en `docs/ESTADO.md`, apartado "Ideas y deuda".
4. Haz commits pequeños mientras avanzas.
5. Ejecuta `npm run check` y arregla lo que falle, sin trampas (regla 11). Si falla algo que no has tocado tú, no lo tapes: dilo en el resumen.
6. Actualiza `docs/ESTADO.md` y `CONTEXTO.md` (fase, última tarea, siguiente tarea y los 5 últimos cambios). Si tomaste una decisión de diseño, añádela a `docs/DECISIONES.md`.
7. Deja `git status` limpio, haz push y abre el Pull Request con la plantilla.
8. Termina con un resumen: qué cambió, cómo probarlo paso a paso, qué queda pendiente y qué dudas tienes.

## 9. Definición de "terminado"

- [ ] Hace lo que pedía la tarea, y nada más.
- [ ] `npm run check` pasa (formato, lint, tipos, tests y build).
- [ ] Textos en `en` y `es`.
- [ ] Probado como coach y como cliente, en ancho de móvil y de escritorio.
- [ ] Tablas nuevas con RLS y test de aislamiento.
- [ ] `docs/ESTADO.md` y `CONTEXTO.md` actualizados.
- [ ] Todo en commits, `git status` limpio y Pull Request abierto.

## 10. Glosario

| Palabra | Significado |
|---|---|
| Tenant | El negocio de un coach. Todo dato pertenece a un tenant. |
| Miembro | Un usuario dentro de un tenant, con un rol. |
| Rol | `owner` (el coach dueño), `staff` (otro coach del mismo negocio; previsto, todavía sin alta) o `client`. |
| Perfil coach | Lo que ven `owner` y `staff`: rutas `/coach/...`. |
| Perfil cliente | Lo que ve `client`: rutas `/client/...`. |
| Módulo | Una función de la app en su carpeta: `src/modules/<función>/`. |
| Manifest | La ficha de un módulo: sus rutas, sus entradas de menú y su flag. |
| Flag | Interruptor que activa o desactiva una función para un tenant. |
| RLS | Reglas de Postgres que filtran las filas que puede ver cada usuario. |
| Migración | Archivo SQL que cambia la base de datos de forma ordenada y repetible. |
| Staging | Entorno de pruebas en la nube, con datos inventados. |
| PR | Pull Request: la petición de fusionar una rama en `main`. |
