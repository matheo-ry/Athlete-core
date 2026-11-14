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
- **Estado:** completada el 2026-11-14. Los dos puntos que quedaban se cerraron en D-038 (el email se verifica) y D-053 (no hay lista pública de coaches). El "enlace por email" pasa a ser un código de 6 dígitos (D-039), y las cuentas de Google y de Apple llegan en la Fase 4 (D-047).

### D-036 · La Fase 1 se diseña entera antes de programar
- **Fecha:** 2026-11-14
- **Decisión:** antes de escribir código de la Fase 1 se decide cómo funciona todo (D-037 a D-064) y se escribe la lista de PR en `docs/PROMPTS.md` §5. Por decisión del propietario, el diseño y los PR de la Fase 1 se llevan desde un mismo chat. Sigue valiendo "una tarea = una rama = un PR", y `CONTEXTO.md` y `docs/ESTADO.md` se actualizan en cada PR para que otro chat pueda continuar.
- **Por qué:** que ningún chat de ejecución tenga que inventarse una decisión de producto. Es una excepción a "un chat por tarea" (GUIA-GIT §8) solo para esta fase.

### D-037 · Primero el código del coach, después la cuenta
- **Fecha:** 2026-11-14
- **Decisión:** quien abre la app sin sesión ve la **primera pantalla** (`/start`): el idioma arriba, el campo "Código de tu coach" con el botón "Continuar" y, debajo, dos enlaces: "¿Ya tienes cuenta? Entrar" y "¿Eres coach? Crea tu negocio". Con un código válido se ve la vista previa del coach (D-051) y desde ahí se crea la cuenta o se entra. El código se recuerda en el dispositivo (7 días como máximo) mientras se crea y se confirma la cuenta; al terminar, el alta con el coach se hace sola. "Soy coach" lleva al registro y después a crear el negocio (D-049).
- **Por qué:** idea del propietario. Casi todos los que abren la app por primera vez son clientes con un código, y así ven la marca de su coach desde el primer minuto.
- **Consecuencias:** cambia ARQUITECTURA §7, que decía "para escribir el código hace falta tener sesión", y obliga a que la vista previa funcione sin sesión (D-051 y D-052). `/welcome` queda para quien tiene sesión y ningún coach.

### D-038 · El email se verifica con un código de 6 dígitos
- **Fecha:** 2026-11-14
- **Decisión:** al registrarse con contraseña llega por email un código de 6 dígitos que se escribe en la app (`/verify`). Sin confirmarlo no se puede entrar. El código caduca a los 15 minutos y se puede pedir otro pasados 60 segundos. Quien intenta entrar con una cuenta sin confirmar va a esa misma pantalla, con un código nuevo. Las cuentas de Google y de Apple (D-047) no pasarán por este paso, porque ya llegan verificadas.
- **Por qué:** sin verificar, alguien puede registrarse con un email mal escrito o ajeno y después no puede recuperar la cuenta. Se usa un código y no un enlace porque en el móvil un enlace abre el navegador y no la app hasta la Fase 4.

### D-039 · Entrar sin contraseña: código por email en lugar de enlace
- **Fecha:** 2026-11-14
- **Decisión:** ajusta D-035. La segunda forma de entrar es "Entrar con un código por email": se escribe el email, llega un código de 6 dígitos y con él se entra. Solo sirve para cuentas que ya existen: no crea cuentas. Los emails llevan solo el código, sin enlaces.
- **Por qué:** el código funciona igual en la web, en iPhone y en Android. Un email sin enlaces además es más difícil de imitar para robar cuentas.
- **Revisar si:** en la Fase 4 hay dominio y apps publicadas; entonces se puede añadir el enlace que abre la app.

### D-040 · Una sola forma de registrarse
- **Fecha:** 2026-11-14
- **Decisión:** toda cuenta se crea con nombre, email y contraseña. El nombre tiene entre 2 y 60 caracteres. Al crear la cuenta se guardan también el idioma de la app en ese momento y la unidad de peso (D-058).
- **Por qué:** si hubiera cuentas sin contraseña, "entrar con contraseña" les fallaría sin que entendieran por qué. Es un camino menos que construir y que probar.

### D-041 · Reglas de la contraseña
- **Fecha:** 2026-11-14
- **Decisión:** mínimo 8 caracteres y máximo 72. No se exigen mayúsculas, números ni símbolos. Un solo campo, con un botón para mostrar lo escrito; no hay campo de "repetir contraseña".
- **Por qué:** las guías de seguridad actuales piden longitud, no símbolos. El botón de mostrar evita el campo repetido.

### D-042 · Recuperar y cambiar la contraseña
- **Fecha:** 2026-11-14
- **Decisión:** "He olvidado mi contraseña" pide el email, envía un código de 6 dígitos y, con el código, deja escribir una contraseña nueva; al guardarla el usuario queda dentro. Desde el perfil se puede cambiar la contraseña escribiendo la actual; quien entró con un código por email no tiene que escribirla, porque ya ha demostrado que el email es suyo. En los dos casos la app cierra después las sesiones de los demás dispositivos, y llega un email de aviso ("tu contraseña se ha cambiado").
- **Por qué:** el mismo sistema de código que D-038 y D-039: una sola cosa que aprender. El aviso permite reaccionar si el cambio no lo hizo el dueño de la cuenta.

### D-043 · La app dice si un email ya tiene cuenta
- **Fecha:** 2026-11-14
- **Decisión:** decisión del propietario. La app nunca cambia de pantalla sola: avisa y resalta la salida que toca.
  - Registrarse con un email que ya tiene cuenta: "Ya existe una cuenta con este email". Botón resaltado "He olvidado mi contraseña" y, al lado, "Entrar".
  - Registrarse con un email cuya cuenta está sin confirmar: "Esta cuenta está pendiente de confirmar". Botón resaltado "Confirmar mi email". Al confirmarla vale la contraseña que se acaba de escribir, no la antigua.
  - Entrar, pedir un código o recuperar la contraseña con un email sin cuenta: "No hay ninguna cuenta con este email". Botón resaltado "Crear cuenta".
  - Entrar con la contraseña equivocada: "La contraseña no es correcta". Botón resaltado "He olvidado mi contraseña".
- **Por qué:** el propietario prefiere mensajes claros a mensajes neutros.
- **Consecuencias:** cualquiera puede averiguar si un email tiene cuenta en ATHLETE CORE probando en la pantalla. Se limita con el tope de intentos de D-052.
- **Seguridad (que valga la última contraseña):** sin esta regla, alguien podría registrar el email de otra persona con una contraseña que solo él conoce. Cuando la dueña del email confirmase la cuenta, esa contraseña seguiría valiendo y el intruso podría entrar en su cuenta. Para no depender de cómo lo haga Supabase, la app vuelve a guardar la contraseña recién escrita nada más confirmar el código. Si entre medias se cerró la app y la contraseña ya no está, después de confirmar se pide elegir una contraseña.
- **Revisar si:** aparecen intentos masivos de comprobar emails; entonces, añadir un captcha.

### D-044 · Idioma de los emails
- **Fecha:** 2026-11-14
- **Decisión:** cada email llega en el idioma que tenía la app al registrarse y, después, en el idioma del perfil. Los emails los envía Supabase Auth, que no lee `profiles`: el idioma se guarda también en los datos de la cuenta (`user_metadata.locale`), y al cambiarlo en el perfil se cambian los dos. Si el asunto de un email no puede depender del idioma, se usa uno bilingüe: "Tu código de ATHLETE CORE · Your ATHLETE CORE code". Hay cuatro emails, en inglés y en español: confirmar la cuenta, código para entrar, código para cambiar la contraseña y aviso de contraseña cambiada. Llevan la marca de ATHLETE CORE, no la del coach.
- **Por qué:** cada persona recibe el suyo sin hacer nada. Los emails de cuenta son de la plataforma: la cuenta es la misma aunque el usuario cambie de coach.

### D-045 · La sesión queda iniciada
- **Fecha:** 2026-11-14
- **Decisión:** una vez dentro, la sesión se mantiene en ese dispositivo. Solo se vuelve a pedir entrar si pasan 30 días sin abrir la app, si el usuario cierra sesión (desde su perfil o sus ajustes) o si cambia la contraseña en otro dispositivo.
- **Por qué:** decisión del propietario. En el gimnasio nadie quiere escribir la contraseña.
- **Cómo se hace:** lo comprueba la propia app (`core/auth`). Guarda en el dispositivo la última vez que se abrió y, si han pasado más de 30 días, cierra la sesión al arrancar. No se usa el cierre por inactividad de Supabase, que según su documentación es del plan de pago (D-063).
- **Consecuencias:** es una comodidad, no una medida de seguridad: la sesión sigue siendo válida en el servidor. Si algún día hace falta que caduque también allí, se activa la opción de Supabase al pasar al plan de pago.

### D-046 · Quién envía los emails
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Local:** no sale ningún email. Se ven en la bandeja de pruebas de Supabase local (`http://127.0.0.1:54324`).
  - **Staging y producción:** los envía **Resend** (servicio de envío de emails), conectado a Supabase por SMTP, con el dominio propio verificado.
  - **Remitente:** nombre "ATHLETE CORE" y dirección `no-reply@<dominio>`. Los textos de privacidad indican una dirección de soporte para responder.
- **Por qué:** el envío que trae Supabase por defecto solo sirve para pruebas: tiene un tope de muy pocos emails por hora. Resend tiene plan gratuito suficiente para staging y los pilotos (comprobar sus límites al contratarlo).
- **Consecuencias:** hace falta el dominio (P-01) antes de enviar el primer email real. Lo configura el propietario en el PR 1.17. Con el envío propio conectado, Supabase sigue poniendo un tope de emails por hora a todo el proyecto: hay que subirlo en el panel (el valor queda en el PR 1.17).
- **Revisar si:** el volumen de emails supera el plan gratuito.

### D-047 · Google y Apple, en la Fase 4
- **Fecha:** 2026-11-14
- **Decisión:** entrar con Google y con Apple se añade en la Fase 4, junto con las apps de móvil. La Fase 1 sale solo con email y contraseña.
- **Por qué:** si la app de iPhone ofrece Google, Apple obliga a ofrecer también "Entrar con Apple", y eso exige la cuenta de desarrollador de Apple (de pago), que toca en la Fase 4.

### D-048 · Coach y cliente a la vez, y cliente de varios coaches
- **Fecha:** 2026-11-14
- **Decisión:** una misma cuenta puede ser dueña de un negocio y, a la vez, cliente de otros coaches. Puede ser cliente de varios coaches. Sigue valiendo que un usuario solo puede ser dueño de un negocio. Cada pertenencia se llama **espacio** en la app (D-056).
- **Por qué:** un coach puede entrenar con otro coach, y un cliente puede tener un coach de fuerza y otro de otra cosa. La base de datos ya lo permite; prohibirlo obligaría a crear segundas cuentas con otro email.

### D-049 · Crear negocio
- **Fecha:** 2026-11-14
- **Decisión:** solo se pide el **nombre del negocio** (entre 2 y 40 caracteres, el mismo límite que el nombre de la marca, D-057) y aceptar las condiciones para coaches (D-060). El plan inicial es `free` (3 clientes, D-017). La marca empieza con ese nombre y los colores por defecto de ATHLETE CORE. Justo después el coach llega a su inicio (`/coach`), donde ve una tarjeta de **primeros pasos** con dos enlaces: "Comparte tu código" (a Clientes) y "Personaliza tu marca" (a Ajustes). La tarjeta desaparece cuando tiene su primer cliente activo.
- **Por qué:** cuanto menos se pregunte antes de ver la app, más coaches terminan el alta. Todo lo demás se puede cambiar después en Ajustes.

### D-050 · Código de invitación: formato, vigencia y regenerar
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Formato:** 8 caracteres, con letras mayúsculas y números, sin los que se confunden al leerlos (`0`, `O`, `1`, `I`, `L`). Se muestra en dos grupos de cuatro (`K7M4 9XQ2`). Al escribirlo no importan las mayúsculas, los espacios ni los guiones.
  - **Vigencia:** no caduca. Cada negocio tiene un solo código activo.
  - **Regenerar:** solo el dueño, con una confirmación. El código viejo y sus enlaces dejan de funcionar al instante. Los clientes que ya estaban dentro no notan nada.
- **Por qué:** un código corto se puede dictar o escribir en una pizarra. Con 31 caracteres posibles y 8 posiciones hay unos 850.000 millones de combinaciones, suficiente junto al tope de intentos (D-052). El generador actual solo usa 16 caracteres.
- **Consecuencias:** los códigos del seed (`IRONLAB1`, `NORTE001`) siguen valiendo: la base de datos acepta cualquier letra o número; solo el generador evita los confusos.

### D-051 · Enlace de invitación y vista previa sin cuenta
- **Fecha:** 2026-11-14
- **Decisión:** el coach puede compartir el enlace `<web>/join?code=XXXX` con el botón de compartir del dispositivo, o copiarlo. Quien lo abre, con sesión o sin ella, ve la **vista previa del coach**: su nombre, su logo y sus colores, con el texto "Vas a entrenar con …". Sin sesión, los botones son "Crear cuenta" y "Ya tengo cuenta". Con sesión, el botón es "Unirme". La vista previa solo enseña nombre y marca, nunca clientes ni otros datos. Para que funcione sin sesión, los logos se pueden leer sin sesión.
- **Por qué:** el cliente confirma que el código es de su coach antes de dar sus datos.
- **Consecuencias:** en la Fase 1 el enlace abre la web. Que abra la app instalada llega en la Fase 4.

### D-052 · Tope de intentos
- **Fecha:** 2026-11-14
- **Decisión:** tras 10 códigos de invitación equivocados en 10 minutos, hay que esperar 15 minutos. Se cuenta por usuario si hay sesión y por conexión (dirección IP) si no la hay. La comprobación de si un email tiene cuenta (D-043) tiene su propio tope: 20 comprobaciones en 10 minutos por conexión. El mensaje es "Demasiados intentos. Vuelve a probar en unos minutos".
- **Por qué:** sin tope, un programa podría probar códigos hasta acertar, o comprobar listas enteras de emails.
- **Revisar si:** contar por dirección IP resulta poco fiable en staging; entonces, añadir un captcha a las pantallas sin sesión.

### D-053 · No hay lista pública de coaches
- **Fecha:** 2026-11-14
- **Decisión:** solo se entra con el código o el enlace que reparte cada coach. Cierra P-09.
- **Por qué:** una lista pública obligaría a revisar perfiles y dejaría que desconocidos ocuparan las plazas del plan de un coach.

### D-054 · Qué pasa al unirse en cada caso
- **Fecha:** 2026-11-14
- **Decisión:** unirse es inmediato; el coach no tiene que aprobar a nadie.
  - **Código que no existe, regenerado o de un negocio suspendido:** "Este código no existe o ya no es válido. Pide a tu coach el código actual". El mismo mensaje en los tres casos.
  - **Plan lleno:** "Tu coach no tiene plazas libres ahora mismo. Avísale para que te haga hueco".
  - **Ya era cliente activo:** entra directamente a su zona de cliente.
  - **Estaba dado de baja:** no entra. "Tu coach te ha dado de baja. Pídele que te reactive" (D-055).
  - **Es el dueño de ese negocio:** "Este es el código de tu propio negocio".
- **Por qué:** cada mensaje dice qué hacer después. Un mismo mensaje para los códigos no válidos evita dar pistas sobre códigos antiguos.
- **Consecuencias:** hoy la función `join_tenant_with_code` reactiva sola a un cliente archivado; hay que cambiarla (PR 1.8).

### D-055 · Dar de baja a un cliente
- **Fecha:** 2026-11-14
- **Decisión:** el coach puede **dar de baja** a un cliente (en la base de datos, `archived`) y **reactivarlo**.
  - El cliente pierde al instante el acceso a todo lo de ese coach y libera su plaza del plan.
  - Sus datos se guardan. El coach lo sigue viendo en la pestaña "Dados de baja".
  - El cliente no puede volver a entrar con el código: solo el coach puede reactivarlo, y solo si hay plaza libre.
  - Si era su único coach, al abrir la app ve la pantalla "Ya no tienes acceso a [nombre del coach]", con la marca de ATHLETE CORE y tres salidas: escribir otro código, crear su negocio o cerrar sesión.
  - No se le avisa por email: lo ve al abrir la app.
  - La cuenta (email y contraseña) es de la persona. El coach no puede borrarla.
- **Por qué:** decisión del propietario: quien deja de pagar al coach no puede seguir usando la app con ese coach. No se borra la cuenta porque en Europa los datos de la cuenta son de la persona, y esa persona puede ser cliente de otro coach.
- **Consecuencias:** hoy un coach puede reactivar a un cliente cambiando una columna, sin que se compruebe el límite del plan. Dar de baja y reactivar pasan a ser funciones de la base de datos, que comprueban el plan y lo anotan en `audit_log` (PR 1.8). Borrar para siempre los datos de un cliente dado de baja, y que el propio cliente pueda dejar a un coach o borrar su cuenta, quedan para la Fase 4.

### D-056 · Qué ve cada uno al entrar: guardas y espacios
- **Fecha:** 2026-11-14
- **Decisión:** al abrir la app:

  | Situación | Adónde va |
  |---|---|
  | Sin sesión | `/start` |
  | Cuenta sin confirmar | `/verify` |
  | Con sesión y ningún espacio activo | `/welcome`: escribir un código, crear su negocio o cerrar sesión |
  | Un espacio activo | `/coach` si es dueño; `/client` si es cliente |
  | Varios espacios activos | El último usado en ese dispositivo; si no hay, el selector (`/select`) |

  - El **selector** lista cada espacio con su logo, su nombre y la etiqueta "Coach" o "Cliente".
  - En el perfil (cliente) y en los ajustes (coach) hay un apartado **Mis espacios**: cambiar de espacio, "Añadir un coach con código" y, si aún no tiene negocio, "Crear mi negocio".
  - **Guardas:** `/coach/...` solo se abre con un espacio activo de coach, y `/client/...` con uno de cliente. Si no, la app lleva al inicio que le toca. Las pantallas de entrada llevan al inicio si ya hay sesión. Quien entra desde un enlace vuelve a ese enlace después de entrar.
- **Por qué:** casi todo el mundo tiene un solo espacio y no debe ver nunca un selector. Las guardas son comodidad; la seguridad sigue en la base de datos (regla de oro 2).

### D-057 · Marca del coach
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Nombre:** un solo campo, "Nombre de tu negocio" (2 a 40 caracteres). Es el que ven los clientes; al guardarlo se actualizan el nombre del negocio y el de la marca.
  - **Colores:** principal y acento (D-028). Se eligen de una paleta de 12 colores o escribiendo uno propio. Hay un botón para volver a los de ATHLETE CORE.
  - **Modo:** claro u oscuro, lo elige el coach para sus clientes. Por defecto, oscuro.
  - **Logo:** PNG, JPG o WebP, de 2 MB como máximo; se recomienda cuadrado y de 256 px o más. No se admite SVG. Sin logo se muestran las iniciales del negocio sobre el color principal. Se puede quitar.
  - El coach ve una **vista previa** antes de guardar.
  - **Qué ve el cliente:** la marca de ATHLETE CORE hasta que escribe un código válido. Desde la vista previa del coach, y durante el registro y la confirmación, la marca del coach. Después de unirse, toda su zona con la marca del coach. En el perfil aparece, pequeño, "Con tecnología de ATHLETE CORE".
- **Por qué:** dos nombres distintos (negocio y marca) confunden al coach. El SVG puede llevar código dentro y es un riesgo de seguridad. Con la marca en el registro, el cliente siente que entra en la app de su coach.
- **Consecuencias:** los logos se guardan en Storage en una ruta que empieza por el `tenant_id`; solo el dueño puede subirlos o borrarlos, y cualquiera puede leerlos (D-051).

### D-058 · Perfil y cuenta
- **Fecha:** 2026-11-14
- **Decisión:** el perfil tiene: nombre (2 a 60 caracteres), idioma (inglés o español), unidad de peso (kg o lb), el email (solo se muestra), cambiar contraseña (D-042), Mis espacios (D-056), enlaces a los textos legales y cerrar sesión. La unidad inicial es lb si el dispositivo está en inglés de EE. UU. y kg en el resto. El cliente lo ve en `/client/profile`; el coach, en `/coach/settings`, junto al negocio y la marca.
- **Por qué:** es lo mínimo para usar la app. Foto de perfil, cambiar el email y borrar la cuenta no son necesarios para probar con datos inventados.
- **Consecuencias:** borrar la cuenta desde la app es obligatorio para publicar en las tiendas y sigue en la Fase 4. Hasta entonces, quien lo pida se atiende a mano desde la dirección de soporte.

### D-059 · Módulo `clients`
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Lista** (`/coach/clients`): dos pestañas, "Activos" y "Dados de baja"; buscador por nombre; orden alfabético. Cada fila muestra las iniciales, el nombre, la fecha en que se unió y la etiqueta "Nuevo" durante 7 días. Arriba, el contador de plazas ("2 de 3 plazas"); con el plan lleno, el aviso "Has llegado al límite de tu plan. Quien use tu código no podrá entrar".
  - **Tarjeta del código**, en la misma pantalla: ver el código, copiarlo, compartir el enlace y regenerarlo (D-050 y D-051).
  - **Ficha del cliente** (`/coach/clients/:id`): nombre, fecha de alta y el botón "Dar de baja" o "Reactivar" (D-055). Las rutinas, las métricas y el tiempo de entreno de cada cliente se añaden aquí como pestañas en las Fases 2 y 3; los pagos, en la Fase 5.
  - **Lista vacía:** "Aún no tienes clientes. Comparte tu código", con la tarjeta del código.
  - El coach **no ve el email** de sus clientes.
- **Por qué:** es lo que pidió el propietario: ver quién ha entrado con su código y poder darlo de baja. El email no hace falta para reconocer a un cliente y es un dato personal más que proteger.
- **Revisar si:** los coaches piden ver el email para distinguir a dos clientes con el mismo nombre.

### D-060 · Protección de datos mínima en el registro
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Al crear la cuenta:** una casilla obligatoria, sin marcar de antemano: "Tengo 16 años o más y acepto los Términos y la Política de privacidad", con enlaces a los dos textos. Se guarda la fecha y la versión de los textos aceptados.
  - **Al crear un negocio:** otra casilla obligatoria: "Acepto las condiciones para coaches". Incluyen el acuerdo por el que ATHLETE CORE trata los datos de los clientes por encargo del coach.
  - **Textos:** las páginas `/legal/terms` y `/legal/privacy` existen desde la Fase 1 con un texto marcado como borrador.
  - **Sin** emails comerciales, analítica ni cookies de seguimiento en la Fase 1: por eso no hace falta aviso de cookies.
  - **Proyectos de Supabase** de staging y de producción, en una región de la Unión Europea.
- **Por qué:** es lo mínimo que piden las normas europeas para crear una cuenta: saber qué se acepta y poder demostrarlo. Los 16 años cubren a toda Europa sin pedir el permiso de los padres.
- **Qué espera a la Fase 4:** los textos legales definitivos (revisados por un profesional), borrar la cuenta desde la app, descargar los propios datos y que un cliente pueda dejar a un coach.
- **Consecuencias:** ningún usuario real puede registrarse antes de tener los textos definitivos. El peso y las medidas corporales pueden contar como datos de salud, que piden un consentimiento aparte: se decide en la Fase 3 (P-12).
- **Menores:** el propietario quiere admitir menores. Se decide en la Fase 3 (P-12); hasta entonces la casilla dice 16 años. La edad mínima para aceptar sin permiso de los padres cambia según el país: 14 en España, 13 en el Reino Unido y en EE. UU., y entre 13 y 16 en el resto de Europa. En EE. UU., aceptar a menores de 13 años obliga a cumplir una ley específica (COPPA) y las tiendas piden revisiones extra, así que se recomienda no bajar de 13.

### D-061 · Sin conexión, sesión caducada y errores
- **Fecha:** 2026-11-14
- **Decisión:**
  - **Sin conexión:** una franja fija "Sin conexión". Lo ya cargado se sigue viendo. Al enviar un formulario: "No hay conexión. Inténtalo de nuevo", sin perder lo escrito. No se guarda nada para enviarlo después (P-06).
  - **Sesión caducada:** la app lleva a `/login` con el aviso "Tu sesión ha caducado. Vuelve a entrar" y, al entrar, devuelve a la pantalla donde se estaba.
  - **Acceso retirado con la app abierta:** al volver a la app o al fallar una petición se comprueban de nuevo los espacios y se aplica D-056.
  - **Código del email equivocado o caducado:** "El código no es correcto o ha caducado", con el botón "Enviar otro código".
  - **Error inesperado:** un mensaje traducido con "Reintentar". El error se registra sin datos personales.
  - Mientras se envía un formulario, su botón queda desactivado para que no se envíe dos veces.
- **Por qué:** toda pantalla trata sus 4 estados (AGENTS.md §4). Estos son los casos comunes a todas.

### D-062 · Orden y tamaño de los PR de la Fase 1
- **Fecha:** 2026-11-14
- **Decisión:** la Fase 1 se reparte en 16 PR, del 1.2 al 1.17, en el orden de `docs/PROMPTS.md` §5. Cada uno se puede revisar en unos 15 minutos y deja algo que se puede comprobar. Los cambios grandes de la base de datos van en dos PR propios (1.2 y 1.8), antes de las pantallas que los usan; las dos migraciones pequeñas (el flag de `clients` y el Storage de logos) van con su función, en los PR 1.10 y 1.16. Los flujos críticos (entrar, registrarse y unirse con código) llevan su test de extremo a extremo en el mismo PR.
- **Por qué:** sustituye a la propuesta de dividir el PR 1.2 en 1.2a, 1.2b y 1.2c: con "primero el código" (D-037) cambia el orden, y numerarlos seguidos es más fácil de seguir. Primero se entra con los usuarios inventados del seed, para ver datos reales cuanto antes; el registro llega después.
- **Si un PR crece:** los dos con más riesgo de pasar de 300 líneas (1.9 y 1.10) traen ya escrito cómo partirlos, en `a` y `b`, para que nadie tenga que inventarlo.

### D-063 · Plan gratuito de Supabase
- **Fecha:** 2026-11-14
- **Decisión:** staging y producción usan el plan gratuito de Supabase. Cierra P-11.
- **Por qué:** decisión del propietario. En la Fase 1 solo hay datos inventados.
- **Consecuencias** (según la documentación de Supabase; se comprueban al crear los proyectos en el PR 1.17):
  - El plan gratuito permite dos proyectos activos: uno para staging y otro para producción. No queda sitio para un tercero.
  - Un proyecto que pasa una semana sin uso se pausa. A staging le pasará a menudo: se reanuda desde el panel en un par de minutos y no pierde nada.
  - No hay copias de seguridad automáticas que se puedan recuperar.
  - El cierre de sesión por inactividad de Supabase es de pago: lo hace la propia app (D-045).
- **Revisar:** antes del primer usuario real. Con datos reales sin copias de seguridad, un fallo o un borrado por error no se puede deshacer: se recomienda el plan de pago en producción para entonces.

### D-064 · Los PR de la Fase 1 se abren apilados
- **Fecha:** 2026-11-14
- **Decisión:** el propietario pidió dejar hecha de una vez, de forma autónoma, toda la Fase 1 que no dependa de él. Como cada PR necesita el anterior y solo él fusiona, cada rama sale de la del PR anterior y su PR apunta a esa rama, como en D-033. El primero de la pila apunta a `docs/diseno-fase-1` (PR 4).
- **Cómo se revisa:** mientras un PR apunta a la rama anterior, GitHub muestra solo sus propios cambios. Se pueden revisar todos antes de fusionar ninguno.
- **Cómo se fusiona:** en orden, de uno en uno y con "Squash and merge". Al fusionar uno se borra su rama y GitHub cambia solo el destino del siguiente a `main`. Antes de fusionar el siguiente, un agente lo pone al día. Basta con decir "pon al día el siguiente PR".
- **Cómo lo pone al día el agente**, sin `push --force`:
  1. `git fetch origin`.
  2. Comprueba que `main` tiene exactamente el contenido de la rama recién fusionada: `git diff origin/main <commit final de esa rama>` no muestra nada.
  3. En la rama siguiente: `git merge -s ours origin/main -m "chore: integrar main tras fusionar el PR anterior"`. Así se apunta que `main` ya está integrado, sin cambiar el contenido de la rama: ese contenido ya incluye todo lo de `main`.
  4. `git push`. Ahora el PR vuelve a mostrar solo sus propios cambios.
  
  Si el paso 2 muestra diferencias (alguien cambió `main` por otro lado), se usa un merge normal y se resuelven los conflictos a mano.
- **Por qué:** con "squash", el commit que entra en `main` es nuevo, y un merge normal daría conflictos en cada archivo que tocan dos PR seguidos. Con el paso 2, el merge `-s ours` es seguro.
- **Caduca:** al fusionar el último PR de la Fase 1.

### D-065 · Topes de intentos para redes compartidas
- **Fecha:** 2026-11-14
- **Decisión:** ajusta D-052. Lo que se cuenta por conexión (sin sesión) tiene un tope más alto: comprobar si un email tiene cuenta, 60 veces cada 10 minutos (antes 20); códigos de invitación equivocados, 30 cada 10 minutos (antes 10). Con sesión, los códigos siguen contando por usuario: 10 equivocados en 10 minutos y 15 de espera.
- **Por qué:** todos los móviles del wifi de un gimnasio salen por la misma dirección IP. Con los topes de D-052, un coach que da de alta a 15 clientes en una clase los habría bloqueado entre ellos. Se vio al probar en local, donde todas las peticiones llegan desde la misma dirección.
- **Consecuencias:** quien quiera averiguar qué emails tienen cuenta puede probar más por hora desde una misma conexión. El dato que se filtra vale poco (que alguien usa una app de entrenamiento) y bloquear a clientes de verdad es peor. Si se ven abusos, se añade un captcha (ya apuntado en "Ideas y deuda").
- **En local:** si al repetir muchas veces los tests de extremo a extremo aparece "Demasiados intentos", espera 10 minutos o ejecuta `npm run db:reset`.

### D-066 · Cuánto se recuerda el último espacio
- **Fecha:** 2026-11-14
- **Decisión:** completa D-056. El último espacio usado se recuerda en el dispositivo, para cada cuenta, mientras la sesión siga abierta: al cerrar y abrir la app se entra directamente en él. Al **cerrar sesión** se olvida, y la próxima vez que se entra con varios espacios se ve el selector. Si la sesión se cierra sola (30 días sin uso), se conserva.
  - Se recuerda al elegir en el selector o en "Mis espacios", al unirse a un coach y al crear el negocio: en los dos últimos casos se entra en el espacio nuevo.
  - Si el espacio recordado deja de estar activo (el coach dio de baja al usuario) y le queda uno, se entra en ese; si le quedan varios, el selector.
  - En el selector y en "Mis espacios", primero el negocio propio y después los coaches, del más antiguo al más nuevo.
- **Por qué:** quien entra a diario en el mismo espacio no debe elegir cada vez, y en un dispositivo compartido la siguiente persona no debe heredar la elección de otra. Es la misma regla que la del código del coach recordado (D-037).

### D-067 · La marca solo se guarda con una función
- **Fecha:** 2026-11-14
- **Decisión:** completa D-057. El nombre, los colores y el modo del negocio se guardan con la función `update_brand`: comprueba que quien la llama es el dueño, que el nombre tiene de 2 a 40 caracteres, que los colores son como `#1E5BD8` y que el modo es claro u oscuro, y cambia a la vez el nombre del negocio y el de la marca. Ya nadie puede cambiar `tenants.name` ni `tenants.branding` a mano desde la app; `tenants.settings`, sí (el dueño).
- **Por qué:** la marca la ven todos los clientes del coach. Si se guardara rota, la app la cambiaría por la de ATHLETE CORE sin avisar; y con dos caminos para guardar, el nombre del negocio y el de la marca podrían quedar distintos.
- **Consecuencias:** el logo (PR 1.16) también tendrá su función. Los tests de aislamiento que editaban el nombre a mano ahora editan `settings`, que sigue protegido por la misma regla de acceso.

---

## Pendientes de decidir

| Nº | Qué | Cuándo hay que decidirlo |
|---|---|---|
| P-01 | Dominio de la web. El nombre ya está decidido: ATHLETE CORE (D-021) | Antes del PR 1.17: sin dominio no se pueden enviar emails reales (D-046) |
| P-02 | Nicho definitivo tras hablar con coaches | Antes de la Fase 2 |
| P-03 | Hosting de la web: Vercel o Cloudflare Pages. Comprobar en ambos el coste con dos personas subiendo código y las condiciones de uso comercial | Antes de enseñar la app a coaches |
| P-04 | Biblioteca global de ejercicios: cómo conviven los ejercicios de la plataforma con los propios de cada coach | Fase 2 |
| P-05 | Pagos: proveedor para la suscripción del coach, cobros del coach a sus clientes y dónde se contrata (web o app, según las normas de las tiendas) | Fase 5 |
| P-06 | Modo sin conexión para registrar entrenos | Tras los primeros pilotos |
| P-07 | Notificaciones push | Fase 4 |
| P-08 | Servicio para compilar iOS en la nube | Fase 4 |
| P-09 | **Cerrado el 2026-11-14.** Cómo se entra: D-035, D-038 (se verifica el email), D-039 (código por email) y D-053 (sin lista pública de coaches) | — |
| P-10 | Servicio de avisos de errores y de caídas | Fase 4 |
| P-11 | **Cerrado el 2026-11-14** por D-063: plan gratuito de Supabase. Se revisa antes del primer usuario real | — |
| P-12 | Consentimiento para datos de salud (peso y medidas corporales), y desde qué edad y en qué países se admiten menores, con permiso de sus padres o sin él. El propietario quiere admitirlos (D-060) | Fase 3 |

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
