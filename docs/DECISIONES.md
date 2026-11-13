# DECISIONES

Registro de decisiones del proyecto y su porqué. Antes de proponer cambiar algo, mira si ya se decidió aquí.

Cómo añadir una: copia el formato, usa el siguiente número y no borres las antiguas. Si una decisión cambia, se añade una nueva que diga "sustituye a D-0XX".

---

## Decisiones tomadas

### D-001 · Una sola app para web, iOS y Android
- **Fecha:** 2026-11-12
- **Decisión:** un repositorio y un solo código con React + Vite + TypeScript, empaquetado para móvil con Capacitor.
- **Por qué:** equipo pequeño; un solo código que mantener y una sola publicación por tienda.
- **Revisar si:** Capacitor limita una función nativa imprescindible.

### D-002 · Supabase como backend
- **Fecha:** 2026-11-12
- **Decisión:** Postgres, Auth, Storage y Edge Functions de Supabase.
- **Por qué:** RLS permite aislar los datos de cada coach en la propia base de datos; sin servidor propio que mantener.
- **Revisar si:** costes o límites lo hacen inviable.

### D-003 · Una carpeta por función
- **Fecha:** 2026-11-12
- **Decisión:** cada función vive en `src/modules/<función>/` con una forma fija (ARQUITECTURA §5).
- **Por qué:** cambios pequeños y localizados, fáciles de revisar y de deshacer; los agentes leen menos código; el colaborador puede trabajar sin tocar `core/`.
- **Revisar si:** los módulos empiezan a necesitarse entre sí constantemente.

### D-004 · Dos perfiles dentro de la misma app
- **Fecha:** 2026-11-12
- **Decisión:** coach y cliente comparten app y login. Cada perfil tiene su carcasa (`app/coach`, `app/client`) y sus pantallas dentro de cada módulo (`coach/`, `client/`).
- **Por qué:** una sola app que publicar y mantener; lógica y datos compartidos por función.
- **Revisar si:** el panel del coach crece tanto que conviene una web aparte.

### D-005 · Multi-tenant por fila
- **Fecha:** 2026-11-12
- **Decisión:** todas las tablas de negocio llevan `tenant_id`, RLS y claves foráneas compuestas. Los permisos se conceden de forma explícita, tabla a tabla.
- **Por qué:** el aislamiento no depende de que el código de la app esté bien escrito.
- **Revisar si:** nunca. Es la regla que no se negocia.

### D-006 · El cliente se une con un código del coach
- **Fecha:** 2026-11-12
- **Decisión:** una sola app en las tiendas. El cliente escribe el código de su coach y ve su marca dentro de la app. Las altas pasan por funciones de la base de datos que comprueban el límite del plan.
- **Por qué:** una publicación en vez de una por coach; sin problemas con las normas de las tiendas sobre apps duplicadas.
- **Revisar si:** los coaches piden app propia en la tienda (sería un plan superior).

### D-007 · Inglés y español desde el primer día
- **Fecha:** 2026-11-12
- **Decisión:** todos los textos pasan por i18next, con `en` y `es`.
- **Por qué:** validar con coaches cercanos en español y vender fuera en inglés con la misma app. Añadir idiomas después es barato; sacar textos escritos directamente en el código es caro.

### D-008 · Primera versión para coaches de gym con foco en fuerza
- **Fecha:** 2026-11-12
- **Decisión:** rutinas, cargas, RM, RPE y progreso.
- **Por qué:** es lo que el equipo conoce y practica; deja la puerta abierta a powerlifting o a entrenamiento híbrido.
- **Revisar si:** las entrevistas con coaches señalan un nicho más concreto.

### D-009 · Código en inglés; documentación y commits en español
- **Fecha:** 2026-11-12
- **Por qué:** el inglés es el estándar del código y de las librerías; el equipo lee y decide mejor en español.

### D-010 · Unidades y formatos
- **Fecha:** 2026-11-12
- **Decisión:** pesos en kg en la base de datos (se muestran en kg o lb), fechas en UTC, dinero en céntimos con su moneda.
- **Por qué:** se vende en países que usan libras; guardar una sola unidad evita errores de conversión.

### D-011 · npm como gestor de paquetes
- **Fecha:** 2026-11-12
- **Por qué:** viene con Node; nada más que instalar ni que aprender.

### D-012 · Flujo de Git
- **Fecha:** 2026-11-12
- **Decisión:** `main` protegida, una rama por tarea, Pull Request, CI obligatorio, "squash merge" y Conventional Commits en español (GUIA-GIT.md).
- **Por qué:** todo cambio queda registrado y se puede deshacer; el trabajo del colaborador y de los agentes siempre pasa por revisión.

### D-013 · Tres entornos
- **Fecha:** 2026-11-12
- **Decisión:** local (Supabase local con Docker), staging y producción. Solo el propietario accede a producción.
- **Por qué:** los agentes pueden recrear y probar la base de datos sin riesgo.
- **Revisar si:** Docker da demasiados problemas en Windows. Alternativa: desarrollar contra staging.

### D-014 · Interfaz con Tailwind y componentes propios
- **Fecha:** 2026-11-12
- **Decisión:** Tailwind CSS y componentes base en `core/ui`, pintados con variables de tema. Se puede partir de componentes de shadcn/ui copiados a `core/ui`. Iconos con lucide-react.
- **Por qué:** el tema por variables es justo lo que necesita la marca de cada coach. Un único juego de iconos evita mezclar estilos.
- **Revisar si:** el juego de iconos se queda corto para el gimnasio (faltan iconos de material o ejercicios).

### D-015 · Estado con TanStack Query y contextos
- **Fecha:** 2026-11-12
- **Decisión:** TanStack Query para datos del servidor; contextos de `core/` para sesión, tenant, idioma y tema. Sin Redux.
- **Por qué:** menos piezas; casi todo el estado de la app son datos del servidor.

### D-016 · Sin desarrollo a medida por cliente
- **Fecha:** 2026-11-12
- **Decisión:** lo que pida un coach se construye como módulo o ajuste genérico, activable con un flag. Nunca código para un coach concreto.
- **Por qué:** una sola base de código que mantener con poco tiempo disponible.

### D-017 · Planes y límites provisionales
- **Fecha:** 2026-11-12
- **Decisión:** `free` (3 clientes), `starter` (10), `pro` (30) y `studio` (sin límite). El límite se comprueba en la base de datos.
- **Revisar si:** siempre que se cambien los precios. Son valores de partida.

### D-018 · Dependencias entre módulos
- **Fecha:** 2026-11-12
- **Decisión:** un módulo solo puede usar a otro a través de su `index.ts` y si está en la tabla de ARQUITECTURA §6. Iniciales: `programs → exercises`; `workouts → programs, exercises`; `progress → workouts, exercises`.
- **Por qué:** las rutinas necesitan ejercicios; prohibirlo del todo obligaría a duplicar. Limitarlo a una dirección evita enredos.

### D-019 · Cómo se decide un feature flag
- **Fecha:** 2026-11-12
- **Decisión:** interruptor general del flag → excepción del tenant (si no ha caducado) → tipo del flag y plan (ARQUITECTURA §9). Los flags `core` y `kill_switch` están activos por defecto; `addon` y `release`, no.
- **Por qué:** un módulo nuevo de tipo `core` funciona para todos sin tener que apuntarlo en cada plan, y cualquier función se puede apagar para todos sin desplegar.

### D-020 · Cambios de plan antes de que existan los pagos
- **Fecha:** 2026-11-12
- **Decisión:** hasta la Fase 5, el plan de un coach lo cambia el propietario a mano en la base de datos. El coach no puede cambiarlo desde la app.
- **Por qué:** permite dar planes de fundador a los primeros coaches sin construir todavía los pagos.

### D-021 · Nombre de la app: ATHLETE CORE
- **Fecha:** 2026-11-12
- **Decisión:** la app se llama **ATHLETE CORE**. En lo técnico (repositorio, carpeta, paquete, web) se escribe `athlete-core`; en redes sociales, `athlete_core`; en el correo, `athlete.core`.
- **Por qué:** decisión del propietario. Resuelve la parte del nombre de P-01; el dominio sigue pendiente.
- **Aplicación:** `[NOMBRE_APP]` se sustituye en `AGENTS.md` y `docs/ARQUITECTURA.md` en el PR 2, a petición del propietario.

### D-022 · TypeScript 6 en lugar de la 7
- **Fecha:** 2026-11-13
- **Decisión:** se usa TypeScript 6.0, aunque la versión estable más reciente es la 7.0.
- **Por qué:** `typescript-eslint` (8.72) solo admite TypeScript anterior a la 6.1. Sin él no hay lint con tipos ni la regla que prohíbe `any`, y eso pesa más que tener la última versión del compilador.
- **Revisar si:** `typescript-eslint` publica soporte para TypeScript 7.

### D-023 · Comandos de npm de la Fase 0
- **Fecha:** 2026-11-13
- **Decisión:** existen todos los comandos de ARQUITECTURA §13 menos los `db:*`: `dev`, `build`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`, `test:watch`, `test:e2e`, `check` y `new:module`. Se añade `prepare`, que Husky necesita para instalar los hooks al ejecutar `npm install`. `check` ejecuta, en este orden: `format:check`, `lint`, `typecheck`, `test` y `build`. `test:e2e` no forma parte de `check` ni del CI hasta la Fase 3.
- **Por qué:** la tarea pedía "exactamente" ocho comandos y a la vez "los de ARQUITECTURA.md", que lista más. El propietario dejó la elección al agente. Se sigue §13 porque es el documento que manda y porque `docs/GUIA-GIT.md` ya nombra varios de ellos. Los `db:*` necesitan Docker y una base de datos: llegan en el PR 1.1.

### D-024 · Cómo se comprueban las fronteras de ARQUITECTURA §6
- **Fecha:** 2026-11-13
- **Decisión:**
  - Las fronteras entre carpetas las comprueba `eslint-plugin-boundaries` (v7, regla `boundaries/dependencies`). Están en `eslint.boundaries.js`, aparte del resto de la configuración de ESLint.
  - Los paquetes que solo puede usar una zona (Supabase, Capacitor, React dentro de `model/`) se limitan con `no-restricted-imports`.
  - El alias `@/` lo resuelve un archivo propio, `scripts/eslint-alias-resolver.cjs`.
  - `scripts/eslint-boundaries.test.mjs` prueba a las propias reglas con imports prohibidos y permitidos.
- **Por qué:** el resolver publicado para TypeScript (`eslint-import-resolver-typescript`) no se podía instalar junto a ESLint 10, y un archivo propio de 40 líneas evita una dependencia. El test existe porque una regla "no negociable" que nadie prueba se puede aflojar sin que nadie lo note.
- **Precisión sobre §6:** "solo `api/` importa el cliente de Supabase" se aplica a todo `src/`. El cliente se importa desde `core/supabase` (donde se define) y desde cualquier carpeta `api/`, también las de `core/` (por ejemplo, `core/auth/api/` en la Fase 1). Además, las carcasas `app/coach` y `app/client` tampoco se importan entre sí.
- **Revisar si:** aparece un resolver oficial compatible con la versión de ESLint en uso.

### D-025 · Cliente de Supabase desde la Fase 0
- **Fecha:** 2026-11-13
- **Decisión:** `core/supabase` ya tiene el cliente, pero no se crea hasta que alguien lo pide y sus dos variables (`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, la clave pública) son opcionales. Nadie lo usa todavía.
- **Por qué:** lo pidió el propietario para esta fase; el plan del kit lo dejaba para el PR 1.2. Las variables son opcionales para que `npm run dev` y el CI funcionen sin base de datos.
- **En la Fase 1:** hacer obligatorias las dos variables y tipar el cliente con los tipos generados (`SupabaseClient<Database>`).

### D-026 · Organización de los textos (i18n)
- **Fecha:** 2026-11-13
- **Decisión:** un solo espacio de i18next con claves `modulo.zona.elemento`. Los textos comunes y los de `app/` viven en `core/i18n/locales/` (prefijos `core.` y `app.`). Los de cada módulo viven en su carpeta `i18n/` y quedan bajo la clave del módulo (`programs.…`). Se cargan todos al arrancar. El idioma inicial sale del dispositivo y la elección del usuario se recuerda en el dispositivo.
- **Por qué:** una sola forma de escribir y de buscar una clave. `app/` no tiene carpeta `i18n` en ARQUITECTURA §5. Cargar todo al arrancar es lo más simple y hoy pesa muy poco.
- **Revisar si:** los textos llegan a pesar; entonces, cargar los de cada módulo al entrar en él.

### D-027 · `_template` y `npm run new:module`
- **Fecha:** 2026-11-13
- **Decisión:** el módulo de ejemplo tiene la clave `template`. Solo se registra en desarrollo, con un import condicional, y no entra en la compilación de producción. `new:module` solo admite nombres de una palabra en minúsculas (`programs`, `workouts`).
- **Por qué:** con una sola palabra, el mismo nombre sirve de carpeta, de clave del módulo, de feature flag y de prefijo de los textos, sin reglas de conversión.

### D-028 · Tema de la marca
- **Fecha:** 2026-11-13
- **Decisión:** el coach elige dos colores (principal y acento) y el modo (claro u oscuro). Los fondos, los textos y los bordes los pone la plataforma según el modo. El texto que va encima de un color de marca es siempre blanco o negro puros, el que más contraste dé. Cuando el color principal se usa como texto (enlaces, elemento activo del menú) se emplea una variante corregida, `--brand-primary-readable`.
- **Por qué:** así ninguna combinación que elija un coach deja la app ilegible. Con blanco y negro puros, el mejor de los dos siempre supera el contraste mínimo de accesibilidad (4,5); con un "casi negro" no se cumplía para colores de luminosidad media.

### D-029 · Tests que vigilan las reglas
- **Fecha:** 2026-11-13
- **Decisión:** además de los tests de lógica, hay tests que comprueban reglas del proyecto y que no hay que tocar al añadir código: (1) las fronteras de arquitectura (D-024); (2) que inglés y español tengan las mismas claves y los mismos huecos, en los textos comunes y en los de cada módulo; (3) que cada módulo cumpla la forma fija de ARQUITECTURA §5. Vitest se organiza en dos grupos: `app` (navegador simulado) y `tooling` (Node, para los tests de las herramientas del repositorio).
- **Por qué:** ARQUITECTURA §2 pide "reglas que se comprueban solas". Un texto sin traducir o una carpeta fuera de sitio se detectan en el ordenador de quien lo escribe, no en la revisión.

### D-030 · Datos de ejemplo de la Fase 0
- **Fecha:** 2026-11-13
- **Decisión:** mientras no haya base de datos, `core/tenancy` y `core/flags` usan datos inventados (`sample-tenancy.ts` y `sample-flags.ts`): dos coaches de ejemplo y el caso "sin coach". El rol inicial se deduce de la dirección (`/client/...` entra como cliente). El selector para cambiar de perfil y de marca solo existe en desarrollo.
- **Por qué:** permite ver y probar las carcasas, la marca y el flujo de entrada de ARQUITECTURA §7 antes de tener cuentas reales.
- **Caduca:** en la Fase 1. Quien usa `useTenancy()` y `useFeature()` no tendrá que cambiar.

### D-031 · Prettier no da formato a la documentación
- **Fecha:** 2026-11-13
- **Decisión:** `.prettierignore` excluye los archivos Markdown y la carpeta `docs/`.
- **Por qué:** `npm run format` reescribiría `AGENTS.md` y otros archivos protegidos, que solo cambian con aprobación del propietario.

### D-032 · Las tablas y funciones nuevas nacen sin permisos
- **Fecha:** 2026-11-13
- **Decisión:** la primera migración activa el bloque OPCIONAL de `esquema-base.sql`: `alter default privileges` quita a `anon` y `authenticated` los permisos sobre tablas, secuencias y funciones nuevas de `public`, y quita a `public` el permiso de ejecutar funciones nuevas en cualquier esquema. Lo demuestra `supabase/tests/02_default_privileges.test.sql`.
- **Por qué:** Supabase, por defecto, abre cada tabla nueva a `anon` y `authenticated`. Con este cambio, olvidarse de un `grant` deja la tabla cerrada (falla en desarrollo y se ve) en lugar de abierta (no falla y no se ve). El RLS sigue siendo la protección principal; esto es una segunda capa.
- **Consecuencias:** cada migración que cree una tabla o función tiene que conceder sus permisos (la plantilla ya lo hace). Una extensión que se active en una migración futura nace también sin permiso de ejecución: si la app necesita sus funciones, la migración las concede. Por eso los tests pgTAP conceden permisos a pgTAP dentro de su transacción.

### D-033 · El PR 1.1 se abre encima del PR de la Fase 0
- **Fecha:** 2026-11-13
- **Decisión:** la rama `db/esquema-base` sale de `chore/fase-0-esqueleto` y su PR apunta a esa rama mientras el PR 1 no esté fusionado. Al fusionarlo, GitHub cambia el destino a `main` y se integra `main` en la rama con un merge (sin `push --force`).
- **Por qué:** la base de datos necesita el esqueleto (scripts, `core/supabase`, CI) y el propietario pidió avanzar sin esperar. Es una excepción puntual a "crear la rama desde `main`" (AGENTS.md §8).

### D-034 · Los tipos generados de la base de datos no pasan por ESLint
- **Fecha:** 2026-11-13
- **Decisión:** `eslint.config.js` ignora solo `src/core/supabase/database.types.ts`. Prettier le da formato y TypeScript lo comprueba como al resto.
- **Por qué:** lo escribe Supabase y no se edita a mano (AGENTS.md §4), así que no se pueden arreglar los avisos que da el lint sobre él (dos tipos con `never` redundante). No es saltarse la regla 11: no se desactiva ninguna regla para código escrito por nosotros.
- **Control:** el CI ejecuta `npm run db:types -- --check`, que falla si alguien edita el archivo a mano o si no se regeneró tras cambiar una migración.

### D-035 · Cómo se entra: contraseña y enlace por email
- **Fecha:** 2026-11-13
- **Decisión:** se puede entrar de dos formas: con email y contraseña, o con un enlace que llega por email. Sin cuentas de Google ni de Apple por ahora. Además, el cliente tiene que poder elegir quién es su entrenador: se resuelve con el código o enlace del coach al unirse y con el selector de tenant ya previsto en la Fase 1 para quien pertenezca a más de un coach.
- **Por qué:** decisión del propietario. Resuelve P-09 salvo un punto.
- **Pendiente de confirmar con el propietario:** si se exige confirmar el email al registrarse con contraseña (recomendado: sí), y si "elegir entrenador" incluye además una lista pública de coaches donde buscar (hoy no está prevista: solo se entra con código).

---

## Pendientes de decidir

| Nº | Qué | Cuándo hay que decidirlo |
|---|---|---|
| P-01 | Dominio de la web. El nombre ya está decidido: ATHLETE CORE (D-021) | Antes de enseñar la app a coaches |
| P-02 | Nicho definitivo tras hablar con coaches | Antes de la Fase 2 |
| P-03 | Hosting de la web: Vercel o Cloudflare Pages. Comprobar en ambos el coste con dos personas subiendo código y las condiciones de uso comercial | Antes de enseñar la app a coaches |
| P-04 | Biblioteca global de ejercicios: cómo conviven los ejercicios de la plataforma con los propios de cada coach | Fase 2 |
| P-05 | Pagos: proveedor para la suscripción del coach, cobros del coach a sus clientes y dónde se contrata (web o app, según las normas de las tiendas) | Fase 5 |
| P-06 | Modo sin conexión para registrar entrenos | Tras los primeros pilotos |
| P-07 | Notificaciones push | Fase 4 |
| P-08 | Servicio para compilar iOS en la nube | Fase 4 |
| P-09 | Resuelto en parte por D-035. Queda: si se exige confirmar el email al registrarse con contraseña, y si habrá una lista pública de coaches | Antes del segundo PR de la Fase 1 |
| P-10 | Servicio de avisos de errores y de caídas | Fase 4 |

---

## Versiones instaladas

Anotadas al terminar la Fase 0 (2026-11-13). Son las estables más recientes de ese día, salvo TypeScript (D-022). Las versiones exactas de todo lo instalado están en `package-lock.json`.

**Entorno**

| Herramienta | Versión | Notas |
|---|---|---|
| Node.js | 24 | Fijada en `.nvmrc` y en `engines` de `package.json`. El CI usa la misma |
| npm | 11 | Viene con Node |

**La app**

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `react`, `react-dom` | 19.3 | La interfaz |
| `react-router` | 8.5 | Rutas |
| `@tanstack/react-query` | 5.107 | Pedir y guardar en caché los datos del servidor |
| `zod` | 4.6 | Validar todo dato que entra |
| `i18next` | 27.1 | Textos en varios idiomas |
| `react-i18next` | 18.0 | Usar i18next desde React |
| `i18next-browser-languagedetector` | 8.3 | Elegir el idioma inicial según el dispositivo |
| `lucide-react` | 1.72 | Iconos |
| `@supabase/supabase-js` | 2.119 | Cliente de Supabase (D-025) |
| `@capacitor/core` | 8.6 | Base para empaquetar la app en móvil |

**Compilación y estilos**

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `typescript` | 6.0 | Lenguaje (D-022) |
| `vite` | 8.3 | Servidor de desarrollo y compilación |
| `@vitejs/plugin-react` | 6.3 | React dentro de Vite |
| `tailwindcss`, `@tailwindcss/vite` | 4.3 | Estilos |
| `@capacitor/cli` | 8.6 | Herramienta de Capacitor (plataformas, en la Fase 4) |
| `supabase` | 3.1 | Herramienta de Supabase (base de datos local, en la Fase 1) |
| `@types/react`, `@types/react-dom`, `@types/node` | 19.3 / 19.3 / 24 | Tipos de TypeScript |

**Tests**

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `vitest` | 5.1 | Tests unitarios |
| `jsdom` | 29.1 | Navegador simulado para los tests |
| `@testing-library/react`, `/dom`, `/jest-dom`, `/user-event` | 16.3 / 10.4 / 7.0 / 14.6 | Probar componentes como los usa una persona |
| `@playwright/test` | 1.65 | Tests de flujos completos en un navegador de verdad |

**Calidad**

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `eslint`, `@eslint/js`, `globals` | 10.14 / 10.0 / 17.14 | Lint |
| `typescript-eslint` | 8.72 | Reglas de lint para TypeScript |
| `eslint-plugin-react-hooks` | 7.1 | Reglas de los hooks de React |
| `eslint-plugin-boundaries` | 7.4 | Fronteras de arquitectura (D-024) |
| `eslint-config-prettier` | 10.1 | Evita que ESLint y Prettier se pisen |
| `prettier` | 3.10 | Formato del código |
| `husky` | 9.1 | Ejecuta comprobaciones al hacer commit y al subir |
| `lint-staged` | 17.6 | Pasa lint y formato solo a los archivos del commit |
| `@commitlint/cli`, `@commitlint/config-conventional` | 21.2 | Comprueba el formato del mensaje de commit |

**Otros valores fijados en la Fase 0**

- CI: `actions/checkout@v7` y `actions/setup-node@v7`.
- Identificador de la app móvil en `capacitor.config.ts`: `app.athletecore.mobile`. Es **provisional**: hay que fijar el definitivo antes de publicar en las tiendas (Fase 4), porque después no se puede cambiar.
