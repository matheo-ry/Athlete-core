# ARQUITECTURA

Dónde va cada cosa y por qué. Si dudas de dónde poner un archivo, la respuesta está aquí.
Los cambios en este documento los aprueba el propietario.

## 1. Resumen

- **Una sola app**, con el mismo código para web, iOS y Android.
- **Dos perfiles** dentro de esa app: **coach** y **cliente**. Mismo inicio de sesión; el rol decide qué se ve.
- **Cada coach es un tenant**: un negocio con sus clientes, sus rutinas y su marca. Los datos de un tenant están aislados de los demás en la propia base de datos.
- El cliente descarga la app, crea su cuenta, escribe **el código de su coach** y a partir de ahí ve el nombre, el logo y los colores de su coach.
- **Una carpeta por función** (rutinas, ejercicios, entrenos…). Cada función se puede activar o desactivar por coach.

## 2. Piezas

| Pieza | Herramienta | Para qué |
|---|---|---|
| Lenguaje | TypeScript (modo estricto) | Menos errores; los agentes fallan menos |
| Interfaz | React + Vite | La app |
| Rutas | React Router | Navegar entre pantallas |
| Datos del servidor | TanStack Query | Pedir, guardar en caché y actualizar datos |
| Validación | Zod | Comprobar todo dato que entra |
| Estilos | Tailwind CSS + componentes propios en `core/ui` | Diseño y tema por coach |
| Iconos | lucide-react | Iconos de menús y botones |
| Idiomas | i18next + react-i18next | Inglés y español |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) | Base de datos, cuentas y archivos |
| Móvil | Capacitor | Empaquetar la misma app para iOS y Android |
| Tests | Vitest + Testing Library, Playwright, pgTAP | Unitarios, flujos completos y seguridad de la base de datos |
| Calidad | ESLint (con fronteras), Prettier, Husky, lint-staged, commitlint | Reglas que se comprueban solas |
| CI | GitHub Actions | Comprobar cada Pull Request |
| Paquetes | npm | Instalar dependencias |
| Hosting web | Por decidir (ver DECISIONES, P-03) | Publicar la web y una vista previa por PR |

Versiones: las estables más recientes en el momento de crear el proyecto. Se anotan en `docs/DECISIONES.md`.

## 3. Entornos

| Entorno | Qué es | Datos | Quién entra |
|---|---|---|---|
| **Local** | Tu ordenador: la app en `localhost` y Supabase local (Docker) | Inventados (`supabase/seed.sql`) | Todos |
| **Staging** | Proyecto de Supabase de pruebas + vista previa de cada PR | Inventados | Todos |
| **Producción** | Proyecto de Supabase real + web publicada + apps de las tiendas | Reales | Solo el propietario |

- Las variables de cada entorno van en `.env.local` (nunca en Git). `.env.example` lista los nombres sin valores.
- En el código de la app solo se usa la clave **pública** de Supabase. La clave `service_role` no entra en `src/`.

## 4. Carpetas del repositorio

```
/
├─ CONTEXTO.md            Resumen de una página: qué es la app y en qué punto está
├─ AGENTS.md              Reglas y normas (lo primero que lee cualquier agente)
├─ CLAUDE.md              Apunta a AGENTS.md
├─ README.md              Qué es el proyecto y cómo arrancarlo
├─ EMPEZAR-AQUI.md        Pasos iniciales y prompt de la Fase 0
├─ docs/                  Documentación
│  ├─ ARQUITECTURA.md     Este archivo
│  ├─ GUIA-GIT.md         Cómo se hace un cambio, paso a paso
│  ├─ ESTADO.md           Qué está hecho, qué está en curso y qué toca
│  ├─ DECISIONES.md       Decisiones tomadas y su porqué
│  ├─ PROMPTS.md          Plantillas de prompt para tareas
│  └─ referencia/         SQL de referencia
├─ src/                   La app (ver §5)
├─ supabase/              Base de datos
│  ├─ migrations/         Cambios de la base de datos, en orden
│  ├─ tests/              Tests de seguridad (RLS)
│  ├─ functions/          Edge Functions (código de servidor)
│  └─ seed.sql            Datos inventados para desarrollo
├─ e2e/                   Tests de flujos completos (Playwright)
├─ scripts/               Scripts de ayuda (crear módulo, comprobaciones)
├─ public/                Archivos estáticos (iconos, manifest)
├─ android/  ios/         Proyectos nativos de Capacitor (desde la Fase 4)
├─ .github/               CI, plantilla de PR y CODEOWNERS
└─ (archivos sueltos)     Configuración de la raíz: package.json, Vite, TypeScript,
                          ESLint, Prettier, Capacitor, .env.example, .gitignore…
```

Los archivos de configuración de la raíz son zona protegida (AGENTS.md, regla 9).

## 5. Dentro de `src/`

Tres bloques, cada uno con un papel:

- **`core/`** son los cimientos: lo que usan todas las funciones.
- **`modules/`** son las funciones de la app: **una carpeta por función**.
- **`app/`** es el marco: arranque, rutas y la "carcasa" de cada perfil.

```
src/
├─ main.tsx               Punto de arranque
├─ index.css              Estilos globales y variables de tema por defecto
├─ app/
│  ├─ providers.tsx       Proveedores globales (sesión, tenant, idioma, tema, datos)
│  ├─ router.tsx          Monta las rutas a partir del registro de módulos
│  ├─ public/             Pantallas de entrada: login, registro, bienvenida, unirse con código
│  ├─ coach/              Carcasa del perfil COACH: layout, menú, inicio
│  └─ client/             Carcasa del perfil CLIENTE: layout, barra inferior, inicio
│
├─ core/                  ZONA PROTEGIDA
│  ├─ auth/               Sesión, login y guardas de ruta
│  ├─ tenancy/            Tenant activo, rol del usuario, unirse con código
│  ├─ branding/           Marca del coach → variables de tema
│  ├─ flags/              Qué funciones están activas para el tenant
│  ├─ billing/            Planes y límites (los pagos llegan en la Fase 5)
│  ├─ i18n/               Configuración de idiomas
│  ├─ supabase/           Cliente de Supabase y tipos generados
│  ├─ modules/            Tipo `ModuleManifest` y `defineModule`
│  ├─ native/             Envoltorio de funciones nativas (Capacitor)
│  ├─ ui/                 Componentes base: Button, Input, Card, Modal…
│  ├─ lib/                Utilidades puras: unidades kg/lb, fechas, logger
│  └─ config/             Variables de entorno validadas
│
├─ modules/
│  ├─ index.ts            Registro: la lista de módulos de la app
│  ├─ _template/          Módulo de ejemplo para copiar (solo se registra en desarrollo)
│  ├─ clients/            Clientes del coach: lista, ficha, código de invitación
│  ├─ exercises/          Biblioteca de ejercicios
│  ├─ programs/           Crear y asignar rutinas
│  ├─ workouts/           Registrar entrenos (cliente) y revisarlos (coach)
│  └─ progress/           Gráficas, RM y récords
│
└─ test/                  Utilidades compartidas para tests
```

La carpeta de cada módulo se crea cuando llega su fase (ver `docs/ESTADO.md`), no antes. En la Fase 0 solo existe `_template`.

Módulos previstos para más adelante: `messaging` (chat y feedback), `habits`, `nutrition`, `payments`.

### La forma fija de un módulo

Todos los módulos tienen las mismas carpetas, aunque alguna esté vacía:

```
modules/programs/
├─ manifest.ts     Ficha del módulo: clave, rutas, entradas de menú
├─ index.ts        Lo ÚNICO que se puede importar desde fuera del módulo
├─ README.md       Qué hace, qué tablas usa y en qué estado está
├─ api/            Consultas a Supabase y sus hooks (único sitio que toca la base de datos)
├─ model/          Tipos, esquemas Zod y lógica pura (cálculos, sin React)
├─ coach/          Pantallas y componentes del COACH
├─ client/         Pantallas y componentes del CLIENTE
├─ shared/         Componentes que usan los dos perfiles
└─ i18n/           en.json y es.json del módulo
```

Por qué una carpeta por función:

- Un cambio toca una sola carpeta. Es más fácil de revisar y de deshacer.
- Un agente lee menos código para entender la tarea, y se equivoca menos.
- El colaborador junior puede trabajar en un módulo sin acercarse a `core/`.
- Activar o desactivar una función es activar o desactivar su módulo.

### El manifest

Cada módulo se describe a sí mismo. `app/router.tsx` lee el registro y monta solo los módulos activos. Ejemplo orientativo (la forma exacta se define en `core/modules`):

```ts
export const programsModule = defineModule({
  key: 'programs', // nombre único; coincide con su feature flag
  routes: {
    coach: [{ path: 'programs', lazy: () => import('./coach/ProgramListPage') }],
    client: [{ path: 'program', lazy: () => import('./client/MyProgramPage') }],
  },
  nav: {
    coach: [{ to: '/coach/programs', labelKey: 'programs.nav.coach', icon: 'clipboard', order: 20 }],
    client: [{ to: '/client/program', labelKey: 'programs.nav.client', icon: 'dumbbell', order: 10 }],
  },
  // Textos del módulo, en cada idioma
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  // Pestañas que este módulo añade a la ficha de un cliente (vista del coach)
  clientProfileTabs: [],
});
```

Así, por ejemplo, la ficha de un cliente (módulo `clients`) puede mostrar sus rutinas y su progreso sin que `clients` importe a `programs` ni a `progress`: son esos módulos los que aportan su pestaña.

## 6. Fronteras: quién puede importar a quién

```
app  ──►  modules  ──►  core
 └───────────────────────▲
```

1. `core/` no importa nada de `modules/` ni de `app/`.
2. Un módulo importa de `core/`. De otro módulo solo puede importar su `index.ts`, y solo si la dependencia está en la tabla de abajo. Nunca importa de `app/`.
3. `app/` importa de `core/` y del registro `modules/index.ts`.
4. Dentro de un módulo:
   - `coach/` no importa de `client/`, ni al revés. Lo común va en `shared/`.
   - `model/` no importa React ni Supabase.
   - `api/` es el único que importa el cliente de Supabase.

Dependencias permitidas entre módulos (siempre en una dirección, sin ciclos):

| Módulo | Puede usar |
|---|---|
| `clients` | — |
| `exercises` | — |
| `programs` | `exercises` |
| `workouts` | `programs`, `exercises` |
| `progress` | `workouts`, `exercises` |

Añadir una dependencia nueva requiere una entrada en `docs/DECISIONES.md`. ESLint comprueba estas fronteras: un import prohibido hace fallar el lint.

Si dos módulos necesitan lo mismo y no encaja en la tabla, esa pieza sube a `core/` (con aprobación del propietario).

La lista de miembros de un tenant la da `core/tenancy`. Por eso, para elegir a un cliente (por ejemplo, al asignar una rutina) ningún módulo necesita depender de `clients`.

## 7. Los dos perfiles: coach y cliente

Es **una app con dos zonas**, no dos apps. Motivo: un solo código que mantener, una sola publicación en las tiendas y un solo inicio de sesión.

| | Coach | Cliente |
|---|---|---|
| Quién es | `owner` o `staff` del tenant | `client` del tenant |
| Dispositivo principal | Ordenador y móvil | Móvil |
| Diseño | Denso: tablas y listas. Menú lateral en escritorio, barra inferior en móvil | Simple: botones grandes, barra inferior. Usable en mitad de un entreno |
| Rutas | `/coach/...` | `/client/...` |
| Carcasa | `src/app/coach/` | `src/app/client/` |
| Pantallas de cada función | `modules/<función>/coach/` | `modules/<función>/client/` |
| Marca | Ve y edita la suya | Ve la de su coach |

### Cómo se entra

```
Abre la app
      │
      ▼
¿Tiene sesión?
      ├─ No ──► Primera pantalla (/start)
      │           ├─ Escribe el código de su coach → vista previa → crea su cuenta o entra → /client
      │           ├─ "Ya tengo cuenta"             → entra
      │           └─ "Soy coach"                   → crea su cuenta → crea su negocio → /coach
      └─ Sí ──► ¿Cuántos espacios activos tiene?
                  ├─ Ninguno ──► /welcome (escribir un código o crear su negocio)
                  ├─ Uno ─────► /coach (owner o staff) o /client (client)
                  └─ Varios ──► el último usado en ese dispositivo o, si no hay, el selector (/select)
```

- El coach, al crear su negocio, recibe un **código de invitación** que comparte con sus clientes. Puede regenerarlo.
- El coach ve en `clients` quién ha entrado con su código y puede dar de baja a un cliente y reactivarlo. Un cliente dado de baja deja de ver los datos de ese coach, libera su plaza en el plan y no puede volver a entrar con el código: solo el coach puede reactivarlo.
- Si un usuario pertenece a más de un tenant, elige con cuál entrar.
- El código se puede escribir sin sesión: se ve la vista previa del coach (solo su nombre y su marca) y después se crea la cuenta o se entra. Unirse sí exige tener sesión.
- El coach también puede compartir un enlace `/join?code=XXXX`. Quien lo abre ve la vista previa del coach. Si no tiene sesión, crea su cuenta o entra, y el código se retoma solo.
- En la primera versión un usuario solo puede ser dueño de un negocio, y el rol `staff` existe en la base de datos pero aún no hay forma de darlo de alta.

### Rutas base

| Zona | Rutas |
|---|---|
| Entrada, sin sesión | `/start`, `/login`, `/signup`, `/verify`, `/reset-password` |
| Entrada, con sesión o sin ella | `/join`, `/legal/terms`, `/legal/privacy`, `/legal/coach-terms` |
| Entrada, con sesión | `/welcome` (si no tiene ningún espacio activo), `/select` (si tiene varios) |
| Coach | `/coach` (inicio), `/coach/clients`, `/coach/programs`, `/coach/exercises`, `/coach/settings` |
| Cliente | `/client` (hoy), `/client/program`, `/client/progress`, `/client/profile` |

Las rutas de cada función las aporta su módulo a través del manifest.

### Importante

Separar las pantallas es **comodidad, no seguridad**. Que un cliente no pueda ver datos de coach lo garantiza la base de datos (RLS), no el hecho de que no tenga el botón.

## 8. Base de datos

SQL de partida: `docs/referencia/esquema-base.sql`. Plantilla para tablas nuevas: `docs/referencia/plantilla-tabla-negocio.sql`.

### Tablas base (Fase 1)

| Tabla | Para qué |
|---|---|
| `plans` | Planes y su límite de clientes |
| `tenants` | El negocio de cada coach: nombre, plan, marca, ajustes |
| `profiles` | Datos de cada usuario: nombre, idioma, unidad de peso |
| `tenant_members` | Qué usuario pertenece a qué tenant y con qué rol |
| `tenant_invites` | Código para unirse a un tenant |
| `features`, `plan_features`, `tenant_features` | Feature flags |
| `audit_log` | Registro de acciones importantes |

### Reglas para tablas de negocio

Una tabla de negocio es cualquiera que guarde datos de un coach o de sus clientes.

1. `tenant_id uuid not null` con clave foránea a `tenants`.
2. `unique (tenant_id, id)`, para que otras tablas puedan apuntarle con clave compuesta.
3. Claves foráneas **compuestas** `(tenant_id, …)`. Así la base de datos impide enlazar la rutina de un coach con el cliente de otro.
4. RLS activado, permisos (`grant`) explícitos y políticas por rol. Sin política, nadie puede hacer nada.
5. Índices que empiecen por `tenant_id`.
6. Un test de aislamiento por tabla.

### Excepciones documentadas (tablas sin `tenant_id`)

- `profiles`: es del usuario, no de un tenant.
- Catálogos de la plataforma: `plans`, `features`, `plan_features`. Solo lectura.
- `exercise_library`: el catálogo de ejercicios de la plataforma, con el nombre en inglés y en español. Solo lectura. Cada negocio recibe su propia copia en `exercises`, que sí lleva `tenant_id` (DECISIONES, D-071).

### Operaciones sensibles

Crear un negocio, ver a qué coach pertenece un código, unirse con código, regenerar el código, y dar de baja o reactivar a un cliente se hacen con **funciones de la base de datos** (`create_tenant`, `preview_invite`, `join_tenant_with_code`, `regenerate_invite_code` y las de dar de baja y reactivar), no con inserciones ni cambios directos desde la app. Ahí se comprueban los límites del plan y el tope de intentos, y se deja constancia en `audit_log`. La vista previa de un código y la comprobación de si un email tiene cuenta son las únicas que se pueden llamar sin sesión: la primera solo devuelve el nombre y la marca del coach, y la segunda solo si el email tiene cuenta y si está confirmada.

El plan y el estado de un tenant no los puede cambiar el coach desde la app. Hasta que existan los pagos (Fase 5), los cambia el propietario a mano en la base de datos. Eso es una operación de administración sobre **datos**; la regla de "solo con migraciones" se refiere a la **estructura** (tablas, columnas, políticas, funciones).

`tenants.branding` y `tenants.settings` los edita el coach, así que nunca deben guardar nada que dé permisos o límites: solo aspecto y preferencias.

### Automatismos

- Al registrarse un usuario se crea su fila en `profiles` (trigger `on_auth_user_created`), con el nombre, el idioma, la unidad de peso y la aceptación de los términos que envía el registro.
- Las tablas con columna `updated_at` la mantienen al día con el trigger `set_updated_at` (ver la plantilla).

### Archivos (Storage)

Cada archivo se guarda en una ruta que empieza por el `tenant_id`, con políticas equivalentes a las de las tablas. Se define en la fase de cada función. Excepción: los logos de los coaches se pueden leer sin sesión, porque se enseñan en la vista previa del código. Solo el dueño del negocio puede subirlos, cambiarlos o borrarlos.

## 9. Planes y feature flags

- La **clave de un módulo** es también su flag. Si el flag está apagado para un tenant, sus rutas y sus entradas de menú no se montan.
- Un flag puede ser de 4 tipos:

| Tipo | Activo por defecto | Para qué |
|---|---|---|
| `core` | Sí, para todos | Parte del producto |
| `addon` | Solo si lo incluye el plan o el tenant lo tiene | Se vende aparte |
| `release` | No; solo donde se esté probando | Temporal. Lleva fecha obligatoria para borrarlo del código |
| `kill_switch` | Sí, para todos | Existe para poder apagar algo sin desplegar |

- Cómo se decide si un tenant tiene un flag activo:
  1. Si el interruptor general del flag (`features.is_enabled`) está apagado, está apagado para todos.
  2. Si el tenant tiene una excepción vigente en `tenant_features`, manda la excepción (sirve para encender o para apagar).
  3. Si no, está activo cuando es `core` o `kill_switch`, o cuando lo incluye su plan.
- La app lo lee de la vista `tenant_effective_features`.
- En el código: `useFeature('clave')` o `<FeatureGate feature="clave">`.
- Los flags son empaquetado de producto, no seguridad. Los **límites** del plan (por ejemplo, el número de clientes) sí se comprueban en la base de datos.
- Hoy el coach no puede cambiar sus flags. Más adelante podrá apagar desde sus ajustes las funciones que no use, con una función de base de datos que no le deje encender lo que su plan no incluye.

## 10. Marca del coach

- Se guarda en `tenants.branding` como JSON y se valida con Zod:

```json
{
  "appName": "Juan Strength",
  "logoPath": "…",
  "colors": { "primary": "#1E5BD8", "accent": "#F26A2E" },
  "mode": "dark"
}
```

- `core/branding` convierte esa marca en variables CSS (`--brand-primary`…). Todos los componentes pintan con esas variables.
- Si un color no tiene contraste suficiente con el texto, se corrige automáticamente.
- Hasta que escribe un código válido, el usuario ve la marca por defecto de ATHLETE CORE. Desde la vista previa del coach, y durante el registro, ve ya la marca de ese coach.

## 11. Idiomas y unidades

- Inglés y español desde el primer día. El idioma inicial sale del dispositivo y el usuario puede cambiarlo.
- Cada módulo tiene sus textos en `i18n/en.json` y `i18n/es.json`. Los textos comunes están en `core/i18n`.
- Lo que escribe el coach (nombres de rutinas, notas) no se traduce.
- Peso: se guarda en kg y se muestra en kg o lb según la preferencia del usuario.
- Fechas: se guardan en UTC y se muestran en la zona horaria del usuario.

## 12. Móvil

- Capacitor empaqueta la misma app web para iOS y Android. No hay código separado por plataforma.
- Las funciones nativas (notificaciones, cámara, salud) se usan solo a través de `core/native`, para que el resto del código no dependa de Capacitor.
- `android/` e `ios/` se generan en la Fase 4 y se guardan en Git.
- La compilación de iOS se hace en un servicio en la nube, sin necesidad de Mac.

## 13. Comandos, tests y CI

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app en local |
| `npm run build` | Compila la app |
| `npm run lint` / `npm run lint:fix` | Revisa (o arregla) estilo y fronteras |
| `npm run format` / `npm run format:check` | Da formato al código (o solo comprueba que lo tiene) |
| `npm run typecheck` | Comprueba los tipos |
| `npm run test` / `npm run test:watch` | Tests unitarios |
| `npm run test:e2e` | Tests de flujos completos |
| **`npm run check`** | **Formato + lint + tipos + tests + build. Lo mismo que exige el CI** |
| `npm run new:module <nombre>` | Crea un módulo a partir de `_template` |
| `npm run db:start` / `db:stop` | Arranca o para Supabase local (desde la Fase 1) |
| `npm run db:reset` | Recrea la base de datos local con migraciones y datos inventados |
| `npm run db:test` | Tests de seguridad de la base de datos |
| `npm run db:types` | Regenera los tipos de TypeScript de la base de datos |

El CI se ejecuta en cada Pull Request:

1. Desde la Fase 0: `npm ci` y `npm run check`.
2. Desde la Fase 1: base de datos local, migraciones, tests de RLS y una comprobación que falla si alguna tabla pública no tiene RLS.
3. Desde la Fase 3: tests de flujos completos.

## 14. Fuera de la primera versión

Para no dispersarse, esto **no** se construye hasta que su fase llegue:

- Pagos (suscripción del coach y cobros del coach a sus clientes).
- Modo sin conexión completo.
- Notificaciones push.
- Chat.
- Integraciones de salud y relojes.
- App propia de cada coach en las tiendas y dominios propios.
- Nutrición.

## 15. Cómo crear un módulo nuevo

1. `npm run new:module <nombre>` copia `_template` con el nombre nuevo.
2. Rellena `manifest.ts` y `README.md`.
3. Añade el módulo al registro `src/modules/index.ts`.
4. Si usa a otro módulo, añade la dependencia a la tabla de §6 y a `docs/DECISIONES.md`.
5. Si necesita tablas, crea la migración con la plantilla de §8 y su test de aislamiento.
6. Añade su flag a la tabla `features` en una migración.
