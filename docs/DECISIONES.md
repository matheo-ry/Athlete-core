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
- **Comprobado en el PR 1.17 (2026-11-14):** dominio `athlete-core.com` verificado en Resend (región de Irlanda), con SPF, DKIM y DMARC (`p=none`). El tope de Supabase queda en 100 emails por hora. El plan gratuito de Resend permite 100 emails al día y 3.000 al mes: ese es el tope real mientras no se pague.
- **Revisar si:** el volumen de emails supera el plan gratuito de Resend (100 al día): antes de los pilotos.

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
- **Consecuencias** (comprobadas el 2026-11-14 en el panel y en la página de precios de Supabase, al crear staging en el PR 1.17; no ha cambiado nada):
  - El plan gratuito permite dos proyectos activos: uno para staging y otro para producción. No queda sitio para un tercero.
  - Un proyecto que pasa una semana sin uso se pausa. A staging le pasará a menudo: se reanuda desde el panel en un par de minutos y no pierde nada. Un proyecto pausado se puede reanudar durante un año; pasado ese plazo, ya no.
  - No hay copias de seguridad automáticas que se puedan recuperar (el panel dice "Free Plan does not include project backups"). El plan Pro, desde 25 dólares al mes, guarda 7 días de copias diarias.
  - El cierre de sesión por inactividad de Supabase es de pago: lo hace la propia app (D-045).
  - En el plan gratuito no se pueden cambiar las plantillas de email mientras se use el envío de emails de Supabase: hay que conectar antes el envío propio (D-046). Por eso, en la guía de staging, Resend va antes que `config push`.
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

### D-068 · Los agentes fusionan con el visto bueno del propietario
- **Fecha:** 2026-11-14
- **Decisión:** un agente puede fusionar Pull Requests en `main`, pero solo cuando el propietario le da el visto bueno expreso para ese PR o ese lote. Cambia la regla anterior ("los agentes no fusionan", AGENTS.md §7 y GUIA-GIT §3 y §8).
- **Cómo se hace:** el agente no pregunta en cada cambio. Junta varios, le dice al propietario qué mirar en la app ("entra en tal pantalla y dime si te gusta") y fusiona cuando él responde que adelante, o cuando ya no queda nada por cambiar y él lo confirma. Siempre con "Squash and merge", con el CI en verde y, en una pila de PR, en orden y poniendo al día el siguiente como explica D-064.
- **Lo que no cambia:** un visto bueno vale para los PR que nombra, no para los siguientes. Nada de `push --force`. Producción sigue siendo solo del propietario (regla 12). El colaborador junior no fusiona.
- **Por qué:** decisión del propietario, que no es programador: prefiere revisar el resultado en la app y no manejar GitHub en cada PR.

### D-069 · Cómo se trabaja la Fase 2: diseño antes, 18 PR en 5 lotes
- **Fecha:** 2026-11-15
- **Decisión:** la Fase 2 se diseñó entera en un chat de diseño, sin código (D-070 a D-088), y su plan está en `docs/PROMPTS.md` §6.
  - **18 PR, del 2.1 al 2.18, en 5 lotes** de 3 o 4. Cada lote termina en algo que el propietario puede probar en la app.
  - **Un lote no empieza hasta que el anterior está fusionado en `main`** con el visto bueno del propietario (D-068). Dentro de un lote los PR se pueden apilar como explica D-064.
  - **Unas 300 líneas de verdad por PR.** Cuentan el código, el SQL y los tests. No cuentan lo que se genera solo (`database.types.ts`) ni los datos (la lista de 120 ejercicios y el seed). Si a mitad de un PR se ve que va a pasar de 400, el agente para y lo parte como dice su bloque.
  - **Los cambios de la base de datos van en PR propios, antes que las pantallas** que los usan (2.1, 2.2, 2.5, 2.6 y 2.12).
  - Cada PR se pide en su chat (GUIA-GIT §8), salvo que el propietario diga otra cosa.
- **Por qué:** en la Fase 1 varios PR pasaron de 1.000 líneas y toda la fase se apiló antes de que el propietario pudiera probarla. Con lotes cortos, un error de diseño se ve con 4 PR hechos y no con 17.
- **Consecuencias:** D-062 y D-064 (el reparto y la pila de la Fase 1) ya no describen cómo se trabaja; de D-064 solo sigue valiendo la forma de poner al día un PR apilado.

### D-070 · Nicho provisional: el coach de gimnasio (P-02)
- **Fecha:** 2026-11-15
- **Decisión:** ajusta D-008. La Fase 2 se construye para un coach de gimnasio "genérico": musculación y fuerza, de 10 a 15 clientes, unos presenciales y otros a distancia, que hoy escribe las rutinas en Excel y las manda por WhatsApp. El powerlifting no se descarta: lo cubren las mismas herramientas (bloques que cambian cada semana o cada mes, D-075).
- **Por qué:** el propietario aún no ha hablado con coaches. Sus rutinas reales (`docs/referencia/rutinas-de-ejemplo.md`) son de máquinas, poleas, mancuernas y peso corporal, y solo dicen cuántas series lleva cada ejercicio. Lo importante es apuntar las cargas y verlas subir, no prescribir porcentajes del RM.
- **Consecuencias:** el porcentaje del RM y el tempo quedan para más adelante (D-076). El RM estimado sigue en la Fase 3: se calcula con lo que apunta el cliente.
- **Estado:** provisional. P-02 no se cierra.
- **Revisar:** cuando el propietario enseñe la demo a 3–5 coaches, que será al terminar la Fase 3 (o antes, con el lote 4 de la Fase 2 hecho). En todo caso, antes de empezar la Fase 4.
- **Qué preguntar a esos coaches:**
  1. ¿Cuántos clientes llevas? ¿Cuántos son presenciales y cuántos a distancia?
  2. Enséñame la última rutina que mandaste. ¿Dónde la escribiste y cuánto tardaste?
  3. ¿Partes de una plantilla o escribes cada rutina desde cero? ¿Qué cambias de un cliente a otro?
  4. ¿Cada cuánto cambias la rutina de un cliente, y qué cambias: ejercicios, series o solo las cargas?
  5. ¿Qué apuntas en cada ejercicio: repeticiones, RIR o RPE, carga, descanso, tempo, porcentaje del RM? ¿Usas superseries?
  6. ¿Cómo te enteras de lo que ha hecho el cliente, y cada cuánto? ¿Qué miras primero?
  7. ¿Qué te quita más tiempo? ¿Qué se te escapa?
  8. ¿Has probado alguna app? ¿Por qué la dejaste, o por qué sigues con ella?
  9. Después de ver la demo: ¿qué te falta para dejar tu Excel mañana? ¿Qué te sobra?
  10. ¿Echas de menos importar tu Excel, subir tus vídeos, el chat o las fotos del cliente?
  11. ¿Cuánto pagarías al mes? ¿Por cliente o por tramos de clientes (D-017)?

### D-071 · Ejercicios: un catálogo de la plataforma y una copia para cada negocio (P-04)
- **Fecha:** 2026-11-15
- **Decisión:** cierra P-04.
  - La plataforma tiene un **catálogo de 120 ejercicios** comunes, con el nombre en inglés y en español. La lista está en `docs/referencia/biblioteca-ejercicios.md`: la escribió el agente y la revisa el propietario.
  - **Cada negocio recibe su propia copia** al crearse. A partir de ahí, todos los ejercicios de la lista de un coach son suyos: les cambia el nombre, la descripción o cualquier otro dato, los archiva y los recupera. No hay un paso de "copiar como mío".
  - Un ejercicio que viene del catálogo recuerda de dónde viene. Mientras el coach no le cambie el nombre, cada usuario lo ve **en su idioma**. Tiene el botón **"Restaurar original"**.
  - Los ejercicios que crea el coach se ven tal como los escribió (ARQUITECTURA §11).
  - Las rutinas apuntan siempre a ejercicios del negocio, nunca al catálogo.
- **Por qué:** con una biblioteca pequeña, el coach nuevo monta una rutina el primer día. Con la copia, "ocultar", "cambiar" y "copiar" son una sola cosa (editar lo tuyo), y el historial del cliente en la Fase 3 sigue a un único ejercicio. Las claves compuestas con `tenant_id` valen igual que en cualquier otra tabla de negocio.
- **Consecuencias:**
  - El catálogo es una tabla sin `tenant_id`, de solo lectura, como `plans` o `features`: es la excepción que ARQUITECTURA §8 tenía pendiente. Ese cambio de §8 lo aprueba el propietario.
  - Si la plataforma añade ejercicios más adelante, una migración los añade al catálogo y a cada negocio. Los que el coach haya cambiado no se tocan.
  - Son unas 120 filas por negocio: no pesa.
- **Revisar si:** los coaches piden más ejercicios de serie, o instrucciones y vídeos ya puestos.

### D-072 · Qué datos tiene un ejercicio
- **Fecha:** 2026-11-15
- **Decisión:**
  - **Obligatorios:** el nombre (de 1 a 80 caracteres) y la forma de medirlo.
  - **Opcionales:** grupo muscular principal, material, instrucciones (hasta 2.000 caracteres), enlace de vídeo (D-074) y la marca **"unilateral"**.
  - **Cuatro formas de medir:**
    - Peso y repeticiones (Remo Gironda).
    - Peso corporal y repeticiones, con lastre opcional (flexiones con mochila, dominadas).
    - Tiempo (plancha).
    - Distancia (empuje de trineo, cinta).
  - **Grupos musculares**, lista cerrada de 14: pecho, espalda, hombro, bíceps, tríceps, antebrazo, abdomen, cuádriceps, femoral, glúteo, aductores, gemelo, cuerpo completo y cardio.
  - **Material**, lista cerrada de 8: barra, mancuernas, máquina, polea, peso corporal, banda, kettlebell y otro.
  - **Unilateral:** el coach prescribe lo mismo para los dos lados. En la Fase 3 el cliente apunta derecha e izquierda por separado.
  - **La forma de medir y la marca "unilateral" no se pueden cambiar** una vez que el ejercicio está en alguna rutina. Para cambiarlas, se duplica el ejercicio.
- **Por qué:** es lo que tiene la app de apuntes del propietario, más lo que hace falta para filtrar. El propietario pidió poder apuntar cada lado por separado: hoy apunta solo el lado más débil y sabe que es un error. Cambiar la forma de medir de un ejercicio con series ya escritas o ya apuntadas las dejaría sin sentido.
- **Revisar si:** los coaches piden grupo muscular secundario u otra forma de medir. Añadir un campo opcional es barato.

### D-073 · Archivar, recuperar, duplicar y buscar ejercicios
- **Fecha:** 2026-11-15
- **Decisión:**
  - **Un ejercicio nunca se borra del todo.** "Archivar" lo quita de la lista y del buscador para rutinas nuevas. Sigue apareciendo en las rutinas donde ya estaba, con la etiqueta "Archivado", y en el historial. Se recupera desde la pestaña "Archivados".
  - **Duplicar** crea una copia propia con otro nombre.
  - **Buscar** por nombre, sin importar tildes ni mayúsculas. **Filtros:** grupo muscular, material y origen ("todos", "míos", "de la plataforma").
  - Si la búsqueda no encuentra nada, aparece **"Crear «lo escrito»"**. También desde el buscador que se abre dentro de una rutina, sin salir de ella.
  - La búsqueda se hace en la app, sobre la lista ya cargada (unos cientos de filas).
- **Por qué:** decisión del propietario: archivar siempre, y poder recuperar. Borrar de verdad rompería las rutinas y el historial.

### D-074 · Vídeo de un ejercicio: solo un enlace
- **Fecha:** 2026-11-15
- **Decisión:** el coach pega un enlace (YouTube, Instagram o cualquier otro que empiece por `https://`). Para el cliente es un botón "Ver vídeo" que abre el enlace fuera de la app. No se suben archivos y el vídeo no se incrusta dentro de la app. El catálogo de la plataforma empieza sin vídeos.
- **Por qué:** el plan gratuito de Supabase da 1 GB de archivos (D-063) y unos pocos vídeos lo llenan. Incrustar vídeos de YouTube dentro de la app traería sus cookies de seguimiento, y hoy la app no tiene ninguna (D-060).
- **Revisar si:** se pasa al plan de pago de Supabase y los coaches piden subir sus propios vídeos. Añadirlo después es un esfuerzo medio.

### D-075 · Cómo es una rutina: bloques, ciclo de días, ejercicios y series
- **Fecha:** 2026-11-15
- **Decisión:** una rutina tiene cinco niveles:

  | Nivel | Qué es | Ejemplo |
  |---|---|---|
  | Rutina | Lo que el coach crea y asigna | "Casa + Gym" |
  | Bloque | Un tramo de la rutina con su propio ciclo y su duración | "Bloque 1 · semanal · 4 vueltas" |
  | Día | Cada día del ciclo: de entreno o de descanso | "Miércoles · Tirón + pierna · Gym" |
  | Ejercicio | Un ejercicio del negocio, en orden | "Remo Gironda agarre amplio" |
  | Serie | Lo prescrito para cada serie (D-076) | "8–12 repeticiones, RIR 1" |

  - **El ciclo** de un bloque dura de 1 a 28 días. Un ciclo de 7 días se llama **"Semanal"** y sus días son lunes, martes…; los demás van por "Día 1, Día 2…".
  - **Los descansos cuentan como día del ciclo** y los coloca el coach.
  - **Cada día de entreno** tiene nombre, subtítulo ("Tirón + pierna") y una etiqueta de lugar ("Casa", "Gym"), los tres opcionales.
  - **La duración de un bloque se mide en vueltas completas del ciclo** (de 1 a 52). La app muestra los días que son: 4 vueltas de un ciclo de 8 días son 32 días.
  - **El último bloque puede no tener fin** ("Sin fecha de fin"): se repite hasta que el coach lo cambie.
  - **Una rutina fija** es un solo bloque sin fin. **Cambios semanales** son bloques de una vuelta semanal; **mensuales**, bloques de 4 vueltas. El coach elige lo que le convenga para cada cliente.
  - **Si el último bloque tenía duración y se acaba, se sigue repitiendo** hasta que el coach lo cambie, y el coach ve un aviso (D-085). El cliente nunca abre la app vacía.
  - **Un bloque semanal va de lunes a domingo.** Si la rutina empieza un miércoles, el cliente hace primero esa semana a medias (miércoles a domingo) y después las vueltas completas.
- **Por qué:** el propietario usó un ciclo de 8 días, y lo normal es repetir el mismo ciclo muchas semanas subiendo cargas. Un solo modelo cubre la rutina fija, la que cambia cada semana y la que cambia cada mes.
- **Consecuencias:** no existe un nivel "semana": una semana es una vuelta de un ciclo de 7 días. La base de datos tiene los cinco niveles desde el primer PR, aunque las pantallas de varios bloques llegan en el PR 2.16.
- **Revisar si:** los coaches de EE. UU. piden que la semana empiece en domingo.

### D-076 · Qué se prescribe en cada serie
- **Fecha:** 2026-11-15
- **Decisión:**
  - **Obligatorio:** cuántas series (de 1 a 10).
  - **Opcional, en cada serie:** repeticiones fijas ("8") o en rango ("8–12"); intensidad; carga objetivo.
  - **Opcional, en cada ejercicio:** descanso entre series y una nota del coach (hasta 500 caracteres), que el cliente ve.
  - **Intensidad:** RIR (repeticiones que se dejan sin hacer, de 0 a 10), RPE (esfuerzo de 1 a 10, con medios puntos) o "al fallo". El coach elige en sus ajustes si trabaja con RIR o con RPE; por defecto, RIR. Si cambia el ajuste, lo ya escrito no se convierte.
  - **Según la forma de medir** (D-072), en vez de repeticiones se prescribe tiempo o distancia.
  - **Una línea por defecto:** "3 × 8–12 · RIR 1 · 2:00" vale para todas las series. El coach la despliega cuando quiere series distintas (la primera, pesada, de 6–8; las demás, de 10–12).
  - La carga se guarda en kg y se enseña en kg o en lb (D-010).
- **Por qué:** cada coach entrena distinto y el propietario pidió no cerrar ninguna puerta. Por dentro se guarda siempre serie a serie: pasar después de "una línea" a "cada serie" sería caro, y es lo que necesita la Fase 3 para que el cliente apunte cada serie.
- **Consecuencias:** el descanso prescrito alimentará el cronómetro de la Fase 3. El ajuste RIR o RPE se guarda en `tenants.settings`, que solo guarda preferencias (ARQUITECTURA §8).
- **Fuera por ahora:** el porcentaje del RM y el tempo. Mientras, el tempo se escribe en la nota. Añadirlos después es barato: un campo opcional más.

### D-077 · Superseries y circuitos: previstos en la base, botón en el último lote
- **Fecha:** 2026-11-15
- **Decisión:** la base de datos permite desde el PR 2.5 agrupar ejercicios seguidos de un mismo día. El botón para agruparlos ("Agrupar con el siguiente") llega en el PR 2.17. Dos ejercicios agrupados son una superserie; tres o más, un circuito. Hasta entonces, el coach lo escribe en la nota.
- **Por qué:** añadirlo a la base más tarde obligaría a tocar tablas que la Fase 3 ya estaría usando. El botón, en cambio, se puede dejar para el final.

### D-078 · Plantillas y rutinas de cliente: cada cliente recibe una copia
- **Fecha:** 2026-11-15
- **Decisión:**
  - Una **plantilla** es una rutina sin cliente. Ningún cliente la ve.
  - Al **asignar** una plantilla, cada cliente recibe **su propia copia**. El coach la retoca para ese cliente y la plantilla no cambia. Editar la plantilla después no cambia las copias ya asignadas.
  - El coach puede **crear una rutina para un cliente desde cero**, sin plantilla.
  - **Sustituir un ejercicio** por otro conserva sus series y su prescripción (otro gimnasio, otra máquina, en casa).
  - **Guardar como plantilla** convierte la rutina de un cliente en una plantilla nueva.
  - **El cliente solo ve su propia rutina:** nunca las plantillas ni las rutinas de otros clientes. Lo garantiza la base de datos (RLS), no la pantalla.
- **Por qué:** es como trabaja el propietario: una plantilla con pequeños cambios para cada cliente.
- **Revisar si:** los coaches piden "cambiar esto a todos los que tienen esta plantilla". Cambiar de copia a enlace sería **caro**: es el corazón del diseño.

### D-079 · Editar una rutina: "Guardar cambios" de una vez
- **Fecha:** 2026-11-15
- **Decisión:**
  - En el editor nada cambia para nadie hasta pulsar **"Guardar cambios"**. Se guarda todo o nada.
  - **Si el coach intenta salir con cambios sin guardar, la app avisa.**
  - **Si la app se cierra sin querer**, lo no guardado se recupera en ese mismo dispositivo: al volver a abrir la rutina se ofrece "Recuperar" o "Descartar". Al cerrar sesión se olvida, como el código del coach recordado (D-037).
  - **Si la misma rutina se guardó desde otro dispositivo** mientras se editaba, la app lo dice y no pisa lo guardado.
  - Las plantillas y las rutinas nuevas se pueden guardar a medias y seguir otro día: ningún cliente las ve hasta que se asignan.
  - Vale igual para plantillas y para rutinas de cliente. Un cambio guardado en la rutina de un cliente lo ve el cliente la próxima vez que abre la app.
- **Por qué:** el propietario pidió que el cliente no vea una rutina a medio cambiar y un aviso por si se sale sin querer. Un borrador guardado en la nube (empezar en el ordenador y terminar en el móvil) cuesta bastante más y se puede añadir después.
- **Consecuencias:** las tablas de rutinas no se escriben directamente desde la app, sino con funciones de la base de datos, que comprueban los permisos y los topes (D-086). Al guardar se conservan los identificadores de lo que no ha cambiado: la Fase 3 los necesita.
- **Revisar si:** los coaches piden seguir en otro dispositivo una edición a medias. Pasar a borrador en la nube es un esfuerzo medio.

### D-080 · Copiar, duplicar y reordenar
- **Fecha:** 2026-11-15
- **Decisión:**
  - **Se puede duplicar a toda escala:** un ejercicio (con sus series), un día, un bloque y una plantilla entera.
  - **Copiar y pegar entre rutinas:** un ejercicio, un día o un bloque se copian en una rutina y se pegan en otra. Lo copiado se guarda en el dispositivo.
  - **Reordenar** ejercicios, días y bloques con botones "Subir" y "Bajar".
- **Por qué:** el propietario pidió poder copiar "todo, en pequeña y en gran escala". Los botones funcionan igual en el móvil y en el ordenador y no necesitan una librería nueva (AGENTS.md, regla 10).
- **Revisar si:** los coaches echan de menos arrastrar con el dedo o con el ratón. El propietario quiere valorarlo más adelante; haría falta proponer una librería.

### D-081 · Asignar una rutina
- **Fecha:** 2026-11-15
- **Decisión:**
  - Se asigna **a uno o a varios clientes a la vez**; cada uno recibe su copia (D-078). Solo a clientes activos.
  - Se elige la **fecha de inicio** (hoy por defecto, o una fecha futura) y el **modo** (D-082).
  - **Un cliente tiene una sola rutina vigente.** Puede tener además una **próxima**, con fecha futura.
  - Al asignar una rutina que empieza hoy, la vigente pasa a **"Anteriores"**. La app avisa antes: "Ana ya tiene la rutina X".
  - Una rutina con fecha futura queda como "próxima". Cuando llega su fecha pasa a ser la vigente, y la que había, a "Anteriores". Asignar otra con fecha futura sustituye a la próxima.
  - El coach puede **terminar** la rutina vigente (el cliente se queda sin rutina) y **cancelar** la próxima.
  - Las rutinas anteriores no se borran.
- **Por qué:** con una sola rutina vigente la app sabe siempre qué toca hoy. Entrenar en casa y en el gimnasio cabe en una rutina con días etiquetados.
- **Consecuencias:** asignar, terminar, cancelar, reiniciar y guardar como plantilla se hacen con funciones de la base de datos, que dejan constancia en `audit_log`.
- **Revisar si:** los coaches piden dos rutinas a la vez para un mismo cliente. Cambiarlo cuesta entre medio y caro.

### D-082 · Calendario, modo lista y día saltado
- **Fecha:** 2026-11-15
- **Decisión:** al asignar, el coach elige el modo para ese cliente:
  - **Con calendario:** la app calcula qué toca cada día a partir de la fecha de inicio y enseña "Hoy toca…" o "Hoy: descanso". El cliente puede abrir igualmente cualquier día.
  - **Lista:** el cliente ve los días de entreno en orden, sin fechas, y va cuando puede.
  - "Hoy" es la fecha del dispositivo del usuario.
  - **Día saltado** (se construye en la Fase 3): el coach elige para cada cliente si el día perdido **se pierde** (el calendario sigue) o si la rutina **se retrasa** (el cliente hace el día pendiente y todo se mueve). En los dos casos queda apuntado que ese día faltó. En modo lista queda apuntado qué días fue y qué día de la rutina hizo.
- **Por qué:** el propietario quiere que cada coach decida lo mejor para cada cliente. La regla del día saltado necesita saber si el cliente entrenó, y eso no existe hasta que apunta sus entrenos.
- **Consecuencias:** en la Fase 2 el modo calendario siempre sigue las fechas. En modo lista, el bloque en el que va el cliente se calcula también por fechas; en la Fase 3 se decide si pasa a contarse por sesiones hechas.

### D-083 · La rutina de un cliente dado de baja, y reiniciar desde una fecha
- **Fecha:** 2026-11-15
- **Decisión:** completa D-055.
  - Al dar de baja a un cliente, **sus rutinas se guardan**. El cliente deja de verlas al instante y el coach las sigue viendo en su ficha, sin poder asignarle otras mientras esté de baja.
  - Al reactivarlo, la rutina vuelve tal cual.
  - **"Reiniciar desde una fecha"**: el coach elige la fecha y el bloque desde el que se retoma (por defecto, el bloque en el que iba). Sirve tras una baja, unas vacaciones o una lesión.
  - Hasta que llega esa fecha, el cliente ve "Tu rutina empieza el…".
- **Por qué:** los datos de un cliente dado de baja se conservan (D-055). Un solo botón cubre la vuelta de una baja y las pausas.

### D-084 · Qué ve el cliente en la Fase 2
- **Fecha:** 2026-11-15
- **Decisión:** el cliente tiene **"Entreno"**, en modo lectura:
  - **"Hoy toca…"** con el nombre del día, su subtítulo, su lugar y cuántos ejercicios y series tiene; o "Hoy: descanso".
  - **Los días del ciclo** del bloque en el que va, y la línea "El siguiente bloque empieza el…".
  - **Cada día** con sus ejercicios, y **cada ejercicio** con sus series, repeticiones, intensidad, descanso, la nota del coach, las instrucciones y el botón del vídeo.
  - **Solo el bloque actual.** Los bloques futuros no se enseñan, así el coach puede retocarlos. Esto es comodidad de la pantalla, no seguridad: la base de datos deja leer al cliente toda su rutina, que es suya.
  - Sin rutina: "Tu coach aún no te ha asignado una rutina".
  - **No hay "Iniciar entreno"**, ni apuntes, ni rutinas anteriores: llegan en la Fase 3.
- **Por qué:** permite enseñar la demo completa (el coach asigna y el cliente lo ve) y es la base sobre la que la Fase 3 añade el registro. La referencia es la app de apuntes del propietario.

### D-085 · Qué ve el coach
- **Fecha:** 2026-11-15
- **Decisión:**
  - Menú del coach: Clientes, **Rutinas**, **Ejercicios** y Ajustes.
  - **Rutinas** tiene dos pestañas. **"Plantillas"**: sus plantillas. **"Asignadas"**: cada cliente activo con su rutina vigente, el bloque en el que va y cuándo termina; o "Sin rutina".
  - **La ficha del cliente** gana la pestaña **"Rutina"**: la vigente, la próxima y las anteriores, y las acciones de D-078, D-081 y D-083.
  - **El inicio del coach** muestra una tarjeta de avisos: clientes cuyo último bloque termina en los próximos 7 días o ya se está repitiendo, y clientes sin rutina. Una rutina sin fecha de fin (D-075) no da aviso. Sin emails ni notificaciones (P-07).
  - **Todo se puede hacer igual en el móvil y en el ordenador.** En el móvil el editor enseña un día cada vez; en el ordenador, los días a la izquierda y el contenido del día a la derecha.
- **Por qué:** con 15 clientes, el coach tiene que ver de un vistazo quién se queda sin rutina. El propietario quiere las mismas funciones en los dos tamaños: unos coaches trabajan en el ordenador y otros en el móvil.
- **Consecuencias:** las pestañas de la ficha estaban previstas en el manifest (ARQUITECTURA §5) pero nadie las pinta todavía: se construye en el PR 2.14. Para que un módulo aporte una tarjeta al inicio hace falta algo parecido: se construye en el PR 2.18. Los dos tocan `src/core/modules`.

### D-086 · Los planes no limitan rutinas ni ejercicios
- **Fecha:** 2026-11-15
- **Decisión:** completa D-017. Los planes siguen limitando solo el número de clientes. Hay **topes de sentido común, iguales para todos**, que comprueba la base de datos:

  | Qué | Tope |
  |---|---|
  | Ejercicios sin archivar por negocio | 1.000 |
  | Plantillas sin archivar por negocio | 300 |
  | Bloques por rutina | 12 |
  | Vueltas por bloque | 52 |
  | Días por ciclo | 28 |
  | Ejercicios por día | 30 |
  | Series por ejercicio | 10 |

- **Por qué:** crear rutinas es el motivo para usar la app, y el límite de clientes ya se entiende solo. Los topes existen para que un error o un abuso no llenen la base de datos.
- **Revisar si:** al fijar los precios se quiere diferenciar los planes por algo más (D-017). Añadir un límite después es barato.

### D-087 · La Fase 3 de reojo, y los datos de salud
- **Fecha:** 2026-11-15
- **Decisión:** la Fase 3 no se diseña aquí, pero lo decidido en la Fase 2 la deja construir sin rehacer tablas:
  - **Las series se guardan una a una** (D-076): el cliente apuntará peso, repeticiones y RIR de cada una, y cada lado en los unilaterales (D-072).
  - **Las rutinas apuntan a ejercicios del negocio** (D-071), así el historial, el RM estimado y los récords siguen al ejercicio aunque cambie la rutina.
  - **Lo que apunte el cliente guardará su propia copia** de lo que tocaba ese día. Por eso el coach puede editar la rutina, o archivar un ejercicio, sin cambiar el pasado.
  - **El descanso prescrito** alimenta el cronómetro.
  - **El modo y la regla del día saltado** (D-082) ya tienen su sitio.
- **Datos de salud y menores (P-12):** la Fase 2 no guarda ningún dato de salud.
  - En los ejercicios de peso corporal se apunta el lastre, no el peso de la persona.
  - **No hay notas privadas del coach sobre un cliente:** ahí acabaría escribiéndose una lesión, que es un dato de salud. Si se quieren, se deciden con P-12.
  - La nota de un ejercicio (D-076) la ve el cliente y es sobre el ejercicio, no sobre la persona.
  - La casilla de 16 años del registro no cambia (D-060).
- **Referencia para la Fase 3:** la app de apuntes del propietario. Tiene el entreno de hoy, "Iniciar entreno", el historial reciente de cada ejercicio, peso, repeticiones y RIR por serie, cronómetro de descanso, notas del día, los ajustes de la máquina ("asiento 2") que se comparten entre rutinas, el historial "45×8(1)", gráficas de peso, 1RM, volumen y repeticiones, récords, rutinas anteriores, peso corporal y descargar en Excel.

### D-088 · Qué queda fuera de la Fase 2
- **Fecha:** 2026-11-15
- **Decisión:** nada de esto se construye en la Fase 2.
  - **Fase 3:** apuntar series, cargas y RIR; el cronómetro; el historial, las gráficas, el RM estimado y los récords; el peso corporal; las rutinas anteriores para el cliente; aplicar la regla del día saltado.
  - **Fase 5:** pagos (P-05).
  - **Sin fase todavía** (apuntado en `docs/ESTADO.md`, "Ideas y deuda"): chat; fotos del cliente; importar desde Excel o pegar una lista de texto; porcentaje del RM y tempo; subir vídeos; borrador guardado en la nube; notas privadas del coach; avisos por email o notificación; arrastrar para reordenar; imprimir o exportar a PDF; compartir plantillas entre coaches; el segundo coach (`staff`); límites por plan.
- **Por qué:** el propietario pidió "cada cosa en su fase". El chat está fuera de la primera versión (ARQUITECTURA §14). Las fotos del cuerpo pueden ser datos de salud y dependen de P-12. Un importador de Excel que falle la mitad de las veces da peor imagen que no tenerlo: cada coach tiene un Excel distinto.

### D-089 · Cómo se guardan los ejercicios en la base de datos
- **Fecha:** 2026-11-15
- **Decisión:** detalles de las tablas del PR 2.1 que D-071 a D-073 no fijaban.
  - **Tablas:** `exercise_library` (el catálogo) y `exercises` (los de cada negocio). El catálogo se identifica por su clave en inglés (`key`), como `plans` y `features`; `exercises.library_key` apunta a ella.
  - **Valores de las listas cerradas, en inglés:**
    - Forma de medir (`measurement`): `weight_reps`, `bodyweight_reps`, `time`, `distance`.
    - Grupo (`muscle_group`): `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `abs`, `quads`, `hamstrings`, `glutes`, `adductors`, `calves`, `full_body`, `cardio`.
    - Material (`equipment`): `barbell`, `dumbbells`, `machine`, `cable`, `bodyweight`, `band`, `kettlebell`, `other`.
  - **El nombre vacío (`null`) significa "vale el del catálogo".** Un ejercicio sin nombre tiene que venir del catálogo. "Restaurar original" vuelve a dejarlo vacío.
  - **Las copias del catálogo no tienen autor** (`created_by` vacío). "Propio" es el que no viene del catálogo (`library_key` vacío).
  - **Una sola copia de cada ejercicio del catálogo por negocio.** El coach no puede crear ejercicios "del catálogo": solo llegan con la copia. "Duplicar" crea uno propio.
  - **Permisos columna a columna:** el coach no elige el id, las fechas ni el origen, y no mueve un ejercicio a otro negocio.
  - **El enlace de vídeo:** empieza por `https://`, sin espacios y con 500 caracteres como máximo.
  - **El tope de 1.000** (D-086) se comprueba al crear y al recuperar un archivado, con el error `exercise_limit_reached`.
  - **El flag `exercises` se añade en el PR 2.3,** con el módulo: un test exige que el catálogo de flags tenga uno por módulo del producto, y nada más.
- **Por qué:** los valores en inglés siguen la norma de código (AGENTS §4) y la app los traduce con i18n. Con el nombre vacío, cada usuario ve el ejercicio en su idioma sin guardar el idioma en ningún sitio. Los permisos por columna dejan cerrado lo que no hace falta abrir (D-032).
- **Consecuencias:** el PR 2.2 escribe los 120 ejercicios con estos valores, y el PR 2.4 valida con Zod las mismas listas y límites.

### D-090 · Cómo se reparte el catálogo a los negocios que ya existen
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.2 que D-071 no fijaba.
  - **La copia va en una función, `copy_exercise_library_to_all_tenants()`.** Pone en cada negocio los ejercicios del catálogo que le falten y nada más: no duplica, y no toca los que el coach haya cambiado o archivado. Nadie tiene permiso para llamarla: solo se usa desde una migración.
  - **Cuando la plataforma añada ejercicios** (D-071), la migración que los añada al catálogo vuelve a llamar a esa función.
  - **El grupo muscular de cada ejercicio es el apartado** de `docs/referencia/biblioteca-ejercicios.md` en el que está. Las filas de la migración salen del documento con un script, no escritas a mano.
  - **El test de las tablas (09) usa un catálogo propio** de una fila; el catálogo real lo comprueba el test 10.
- **Por qué:** hacía falta poder repetir la copia para probar que no duplica, y la misma pieza sirve para las ampliaciones futuras del catálogo. El trigger del PR 2.1 (un negocio nuevo) no se toca.
- **A tener en cuenta:** la copia pasa por el tope de 1.000 (D-086). Si algún día un negocio tiene casi 1.000 ejercicios sin archivar y el catálogo crece, la migración fallaría: habrá que decidir entonces si esas copias se saltan el tope.

### D-091 · Cómo funciona la lista de ejercicios
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.3 que D-073 no fijaba.
  - **El número de cada pestaña es el total** de activos o de archivados, sin contar la búsqueda ni los filtros: así no cambia mientras se escribe.
  - **Se busca en el nombre que se ve.** En español, "pulldown" no encuentra "Jalón al pecho".
  - **Los filtros son desplegables del propio sistema**, con "Todos" como primera opción. El desplegable vive en el módulo (`coach/FilterSelect.tsx`) porque `core/ui` no tiene uno y es zona protegida.
  - **La app carga los dos nombres del catálogo** (inglés y español). Cambiar de idioma no vuelve a pedir nada.
  - **Primero se piden los activos.** La API de Supabase devuelve 1.000 filas como mucho (`max_rows`), y el tope de activos es también 1.000 (D-086): la pestaña "Activos" sale siempre entera.
- **Por qué:** son las opciones más sencillas que cumplen D-073. Un desplegable nativo abre en el móvil la lista del propio sistema, que es la más cómoda con el dedo.
- **A tener en cuenta:** un negocio con más de 1.000 ejercicios entre activos y archivados vería incompletos los archivados (apuntado en "Ideas y deuda"). Si el PR 2.4 necesita un desplegable en el formulario, es el momento de subir `FilterSelect` a `core/ui`, con el visto bueno del propietario.

### D-092 · Cómo funciona el formulario de un ejercicio
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.4a que D-072 a D-074 no fijaban.
  - **El PR 2.4 se parte en dos,** como preveía su bloque: 2.4a (crear y editar) y 2.4b (archivar, recuperar, duplicar y restaurar). Aun así, el 2.4a ronda las 650 líneas de código y 380 de tests: partir el formulario dejaría una pantalla a medias.
  - **El ejercicio abierto va en la dirección:** `/coach/exercises?exercise=<id>`, `?exercise=new` y `?exercise=new&name=…` (el "Crear «lo escrito»"). En el móvil, "Atrás" cierra el formulario, y recargar no lo pierde.
  - **En el móvil el formulario sustituye a la lista** dentro de la carcasa (la barra inferior sigue a la vista). **Desde 1.024 px de ancho** es un panel a la derecha de la lista, que se queda fijo al bajar.
  - **Al guardar, el formulario se cierra** y la lista dice "«Nombre» guardado".
  - **Un ejercicio del catálogo al que no se le toca el nombre sigue sin nombre propio** (D-089): cambiarle el grupo no lo deja "congelado" en un idioma. Si el coach escribe otro nombre, se guarda el suyo.
  - **La forma de medir son 4 opciones a la vista,** cada una con su ejemplo, sin ninguna marcada al crear: es la que más pesa después (D-072). Grupo y material son desplegables con "Sin indicar" como primera opción.
  - **"Ver vídeo"** aparece en el formulario cuando el ejercicio tiene enlace guardado, y abre una pestaña nueva (D-074).
  - **`FilterSelect` y el campo de varias líneas (`TextArea`) se quedan en el módulo:** `core/ui` es zona protegida y esta tarea no la pedía. Apuntado en "Ideas y deuda".
- **Por qué:** son las opciones más sencillas que cumplen el bloque del PR. La dirección es la forma más barata de que "Atrás" funcione en el móvil sin una ruta nueva en el manifest.
- **Revisar si:** los coaches piden crear varios ejercicios seguidos sin que el formulario se cierre.

### D-093 · Archivar, recuperar, duplicar y "Restaurar original"
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.4b que D-071 y D-073 no fijaban.
  - **Las tres acciones van en el panel del ejercicio,** debajo del formulario: "Duplicar", "Restaurar original" y "Archivar" (o "Recuperar", si está archivado). Un ejercicio archivado también se puede editar.
  - **Archivar no pide confirmación:** se deshace con "Recuperar". Archivar, recuperar y restaurar cierran el panel y la lista lo dice ("«Burpee» archivado. Lo tienes en Archivados").
  - **"Restaurar original" sale solo si algo ha cambiado:** el nombre, la forma de medir, unilateral, el grupo, el material, o si tiene instrucciones o vídeo (el catálogo no trae ninguno, D-074). **Lo deja como el catálogo**, sin instrucciones ni vídeo, y por eso **pide confirmación** diciendo que se quitarán.
  - **"Duplicar" copia todo,** también las instrucciones y el vídeo, con el nombre "… (copia)" ("… (copy)" en inglés) y como ejercicio propio y activo. Se abre su formulario para cambiarle el nombre.
  - **La app carga los datos del catálogo junto a cada ejercicio** para saber si ha cambiado y para restaurarlo, sin pedir nada más. Restaurar es un cambio normal del ejercicio: no hace falta ninguna función nueva en la base de datos.
- **Por qué:** "Restaurar original" quiere decir volver a lo que trae la plataforma. Quitar instrucciones o un vídeo que escribió el coach no se puede deshacer, así que se avisa antes.
- **Revisar si:** los coaches piden que restaurar conserve sus instrucciones y su vídeo.

### D-094 · Cómo se guardan las rutinas en la base de datos
- **Fecha:** 2026-11-15
- **Decisión:** detalles de las tablas del PR 2.5 que D-075 a D-083 no fijaban.
  - **Tablas:** `programs` (rutinas), `program_blocks` (bloques), `program_days` (días del ciclo) y, en el PR 2.5b, `program_day_exercises` y `program_sets`.
  - **Una plantilla es una rutina sin cliente** (`client_id` vacío). La base de datos impide que una plantilla tenga fecha de inicio, y que la rutina de un cliente no la tenga o se archive: las de cliente se terminan (`ended_at`), las plantillas se archivan (`archived_at`).
  - **Cada tabla hija lleva también el id de su rutina** (`program_id`), dentro de su clave foránea. Así una fila no puede colgar de un bloque de otra rutina, y el RLS sabe de quién es cada fila sin recorrer niveles.
  - **Desde la app solo se lee.** No hay permiso de escritura para nadie: se escribe con las funciones de los PR 2.6 y 2.12. Por eso las reglas que cruzan filas (qué bloque puede no tener fin, que haya una fila por cada día del ciclo, que el día no pase de los días del ciclo) las comprueba la función que guarda, no la tabla.
  - **Valores, en inglés:** modo `calendar` o `list` (D-082); tipo de día `training` o `rest`.
  - **"De qué plantilla salió"** (`source_program_id`) es solo informativo: no tiene clave foránea.
  - **"Desde qué bloque se cuenta"** (`start_block_id`, D-083): vacío quiere decir el primero. Tiene que ser un bloque de esa misma rutina.
  - **Un cliente lee el contenido de su rutina** con `is_program_client`, que solo responde sí o no sobre el propio usuario. Ve también su rutina próxima y las anteriores; cuál enseñar lo decide la pantalla.
  - **El flag `programs` se añade en el PR 2.7,** con el módulo (misma salvedad que D-089).
- **Por qué:** con una sola puerta de escritura, las reglas viven en un sitio y la Fase 3 puede fiarse de los identificadores (D-087).
- **A tener en cuenta:** "una sola rutina vigente por cliente" (D-081) depende de fechas y la comprueban las funciones del PR 2.12, no la tabla.

### D-095 · Cómo se guardan los ejercicios de un día, las series y las rutinas de ejemplo
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.5b que D-072, D-076 y D-077 no fijaban.
  - **Tablas:** `program_day_exercises` (los ejercicios de cada día) y `program_sets` (una fila por serie). Solo lectura desde la app, como las de D-094.
  - **Repeticiones fijas** se guardan con mínima y máxima iguales. Una serie lleva repeticiones, tiempo (segundos, hasta 24 horas) o distancia (metros, hasta 1.000 km): solo una de las tres. Que coincida con la forma de medir del ejercicio lo comprueba la función que guarda (PR 2.6).
  - **Intensidad:** `rir` (0 a 10, sin medios), `rpe` (1 a 10, con medios) o `failure` (sin número).
  - **Superseries:** un número de grupo (`superset_group`, de 1 a 15) en los ejercicios seguidos de un día.
  - **El cliente lee los ejercicios del negocio que aparecen en alguna de sus rutinas,** también en las anteriores y en la próxima, y ningún otro.
  - **La regla de D-072** da el error `exercise_in_use` al cambiar la forma de medir o "unilateral" de un ejercicio que está en cualquier rutina, también en plantillas archivadas y en rutinas terminadas.
  - **Un ejercicio que está en una rutina no se puede borrar** ni saltándose el RLS: lo impide la clave foránea.
  - **Seed:** en un bloque semanal el nombre del día se deja vacío, porque la app ya pone "Lunes", "Martes"…; el subtítulo ("Tirón + pierna") y el lugar sí se guardan. Los 20 ejercicios de las rutinas del propietario que no están en el catálogo con ese mismo nombre se crean como propios de Iron Lab.
- **Por qué:** son las opciones más sencillas que cumplen el diseño. Guardar la repetición fija como un rango de un solo número evita tener dos formas de decir lo mismo.
- **A tener en cuenta:** con las rutinas de ejemplo, "Restaurar original" de un ejercicio del catálogo que esté en una rutina falla si el coach le había cambiado la forma de medir. La pantalla lo explicará en el PR 2.9, como preveía el bloque del PR 2.4.

### D-096 · Cómo se guarda una rutina de una vez
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.6 que D-079 y D-086 no fijaban.
  - **Una sola función, `save_program(negocio, rutina)`,** recibe la rutina entera en JSON (sus bloques, días, ejercicios y series, en orden) y devuelve `{ id, updated_at }`. Sin `id`, crea una plantilla; con `id`, actualiza esa rutina, sea plantilla o de un cliente, sin cambiarle el cliente ni la fecha.
  - **Lo que trae `id` conserva su identificador**, lo que no lo trae se crea y lo que ya no viene se borra. Un `id` que no es de esa rutina da `invalid_reference`.
  - **El orden es el de la lista:** la posición no se envía.
  - **Conflicto entre dispositivos:** la app envía el `updated_at` que cargó (`expected_updated_at`). Si no coincide, `program_conflict` y no se guarda nada.
  - **Errores, uno por regla:** `not_allowed`, `invalid_name`, `program_not_found`, `program_conflict`, `program_needs_block`, `too_many_blocks`, `invalid_cycle`, `invalid_laps` (fuera de 1 a 52, o sin fin en un bloque que no es el último), `invalid_days` (no hay exactamente un día por cada día del ciclo), `rest_day_with_exercises`, `too_many_exercises`, `exercise_needs_sets`, `too_many_sets`, `exercise_not_found` (no existe o es de otro negocio), `exercise_archived`, `invalid_set_target` (repeticiones, tiempo o distancia que no casan con la forma de medir) y `template_limit_reached`.
  - **Un ejercicio archivado** se puede conservar en cualquier día de una rutina que ya lo tenía, aunque se mueva de sitio.
  - **Archivar y recuperar** van en `set_program_archived(negocio, rutina, archivada)`. Solo plantillas (`not_a_template` si es de un cliente). Recuperar pasa por el tope de 300.
  - **No se deja constancia en `audit_log`:** guardar es una edición normal, como cambiar un ejercicio. Sí la dejarán asignar, terminar y reiniciar (D-081, PR 2.12).
- **Por qué:** con un documento entero el editor puede trabajar sin conexión con la base de datos hasta "Guardar cambios", y la base de datos sigue siendo la única que decide qué vale.

### D-097 · Cómo funciona la lista de plantillas
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.7 que D-085 no fijaba.
  - **"Activas" y "Archivadas" son dos pestañas con su número**, como en "Ejercicios" (D-091). La pestaña "Asignadas" de D-085 llegará en el PR 2.13 por encima de estas.
  - **Cada fila:** "Semanal" o "Ciclo de N días", "N días de entreno" y "Editada el…". **Con varios bloques**, solo "N bloques": cada bloque puede tener su ciclo y sus días de entreno.
  - **"Nueva plantilla" y "Renombrar" se hacen en la propia lista,** sin cambiar de pantalla: un formulario encima de la lista y un campo en la fila.
  - **Renombrar carga la rutina entera y la vuelve a guardar** con `save_program` (D-096): es la única forma de cambiar una rutina. Si otra persona la cambió entre medias, dice "Esta rutina se ha cambiado desde otro dispositivo".
  - **Una plantilla archivada no se renombra:** primero se recupera.
  - **El documento de una rutina** (el esquema Zod del editor) vive en `model/program-document.ts`, con los mismos topes que la base de datos.
  - **Icono del menú:** `clipboard`.
- **Por qué:** son las opciones más sencillas que cumplen el bloque del PR y se parecen a lo que el coach ya conoce de "Ejercicios".

### D-098 · Cómo funciona el editor de los días del ciclo
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.8a que D-075, D-079 y D-085 no fijaban.
  - **El PR 2.8 se parte en dos,** como preveía su bloque: 2.8a (el editor y "Guardar cambios") y 2.8b (aviso al salir y recuperación en el dispositivo). El aviso "Esta rutina se ha cambiado desde otro dispositivo", con "Volver a cargar", va ya en el 2.8a: es lo que contesta `save_program` y no cuesta nada enseñarlo.
  - **Dirección:** `/coach/programs/<id>`, con el día abierto en `?day=3`. En el móvil, "Atrás" vuelve a la lista de días. En escritorio siempre hay un día abierto: el primero si no se ha elegido.
  - **Los nombres de la semana salen del propio navegador** (`Intl`), en el idioma de la app y con mayúscula: "Lunes", "Monday". El día 1 de un ciclo semanal es el lunes (D-075).
  - **El ciclo se cambia con un campo y "Cambiar",** no al escribir: escribir "10" pasa por "1", y acortaría el ciclo a un día.
  - **Marcar como descanso un día con ejercicios pide confirmación** y se los quita: `save_program` no admite ejercicios en un día de descanso (D-096). El nombre, el subtítulo y el lugar se conservan.
  - **Al guardar, la rutina se vuelve a pedir** y el editor empieza de nuevo desde lo guardado: así lo nuevo trae su identificador y el siguiente guardado no lo duplica.
  - **"Nueva plantilla" abre el editor** de la plantilla recién creada, y el nombre de cada fila de la lista abre el suyo.
  - **El nombre de la rutina se cambia en la lista** ("Renombrar", D-097), no en el editor.
- **Por qué:** son las opciones más sencillas que cumplen el bloque del PR.

### D-099 · Aviso al salir y recuperación de los cambios en el dispositivo
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.8b que D-079 no fijaba.
  - **Mientras hay cambios sin guardar, se guardan en el dispositivo** (`localStorage`), uno por usuario y rutina. Al volver a abrir esa rutina se ofrece "Recuperar" o "Descartar"; hasta que el coach elige, no se toca lo guardado.
  - **Un borrador solo vale si parte de la versión que hay ahora.** Si la rutina se guardó después desde otro sitio, el borrador se olvida sin preguntar: recuperarlo acabaría en "se ha cambiado desde otro dispositivo".
  - **Se olvidan todos al cerrar sesión.** Los módulos guardan sus borradores con un prefijo común (`athlete-core.draft.`) y `clearDeviceDrafts()` (`core/lib`) los borra donde ya se borraban el último espacio y el código a medias (`core/tenancy/TenancyProvider`). **Toca `src/core/`**, zona protegida: el bloque del PR pedía que se olvidaran al cerrar sesión y no hay otra forma. Servirá también a los entrenos de la Fase 3. Como con el último espacio (D-066), solo al cerrar sesión el propio usuario, no cuando caduca.
  - **Salir a otra pantalla de la app con cambios pide confirmación** ("¿Salir sin guardar?", con "Quedarme" y "Salir"). Cambiar de día no sale del editor y no pregunta. Mientras se está guardando tampoco: el guardado sigue aunque se salga.
  - **Cerrar la pestaña o recargar** con cambios muestra el aviso del propio navegador; su texto no se puede cambiar.
  - **"Cambios guardados" desaparece en cuanto se vuelve a cambiar algo,** para que no parezca que lo nuevo ya está guardado.
- **Por qué:** cumple D-079 con el menor número de piezas, y los borradores no se quedan en un dispositivo compartido.

### D-100 · Cómo se ponen los ejercicios de un día
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.9a que D-073, D-078 y D-080 no fijaban.
  - **El PR 2.9 se parte en dos,** como preveía su bloque: 2.9a (lista, añadir, crear, ordenar y quitar) y 2.9b (sustituir, nota, archivados y bloquear la forma de medir).
  - **El módulo `exercises` ofrece por su `index.ts`** dos piezas para otros módulos: `ExercisePicker` (el buscador con los filtros de "Ejercicios", solo con los activos, y "Crear «lo escrito»" con el mismo formulario) y `useExerciseOptions` (el nombre a la vista, la forma de medir y si está archivado, por identificador). Las dos usan la misma consulta que "Ejercicios": comparten la caché.
  - **El buscador ocupa el sitio del día** mientras se elige, en el móvil y en escritorio. Elegir uno lo añade al final del día y vuelve al día.
  - **Un ejercicio nuevo entra con 3 series vacías** y sin descanso ni nota. La prescripción se escribe en el PR 2.10.
  - **"Quitar" pide confirmación solo si hay algo escrito:** alguna serie con datos, descanso o nota.
  - **Los botones de ordenar son flechas** (↑ ↓ ✕) con su nombre completo para los lectores de pantalla ("Subir: Lat pulldown"), para que quepan en una fila en el móvil.
- **Por qué:** son las opciones más sencillas que cumplen el bloque del PR y reutilizan lo que ya conoce el coach.

### D-101 · Sustituir, la nota, los archivados y el bloqueo de la forma de medir
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.9b que D-072, D-073 y D-078 no fijaban.
  - **"Sustituir" (⇄)** abre el mismo buscador, solo con los ejercicios activos que se miden igual. El sustituto ocupa el mismo sitio y hereda las series, el descanso y la nota.
  - **La nota** se escribe debajo del ejercicio ("Añadir una nota"), hasta 500 caracteres. Si ya tiene nota, el campo está siempre a la vista.
  - **Un ejercicio archivado** que ya estaba en la rutina se ve con la etiqueta "Archivado". Se puede mover, quitar y sustituir; no sale en el buscador.
  - **En el formulario de un ejercicio que está en alguna rutina,** la forma de medir y "unilateral" quedan desactivadas, con el texto "Este ejercicio ya está en una rutina. Para cambiar cómo se mide, duplícalo". La app lo sabe contando sus apariciones en `program_day_exercises` (una consulta sin filas).
  - **Si la base de datos rechaza el cambio** (`exercise_in_use`; por ejemplo, "Restaurar original" de un ejercicio al que se le cambió la medida antes de usarlo), la app lo explica en vez de decir "Algo ha ido mal".
- **Por qué:** son las opciones más sencillas que cumplen el bloque del PR. La regla la sigue garantizando la base de datos (migración 12); la pantalla solo evita el error.

### D-102 · Cómo se escribe lo prescrito en un ejercicio
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.10a que D-076 no fijaba.
  - **El PR 2.10 se parte en dos,** como preveía su bloque: 2.10a (la línea, "Series distintas", repeticiones, intensidad, descanso y el resumen) y 2.10b (el ajuste RIR o RPE y la carga en kg o lb). Escribir segundos o metros en vez de repeticiones va ya en el 2.10a: sin eso, un ejercicio de tiempo no se podía guardar.
  - **El editor de cada ejercicio está siempre a la vista** debajo de su nombre: número de series (desplegable de 1 a 10), repeticiones, intensidad y descanso.
  - **Repeticiones:** un campo de texto, "8" o "8-12". Mientras lo escrito no vale ("8-"), la rutina no cambia y el campo lo dice.
  - **Intensidad:** un desplegable con "—", los valores de la escala del coach y "Al fallo". Lo escrito con la otra escala se sigue viendo, sin convertir (D-076). Hasta el PR 2.10b, la escala es RIR.
  - **Descanso:** minutos (0 a 10) y segundos (00, 15, 30, 45) en dos desplegables, más los atajos 1:00, 1:30, 2:00 y 3:00. "—" en minutos quiere decir sin descanso indicado.
  - **Cambiar el número de series** copia la última serie en las nuevas y quita las del final.
  - **"Series distintas"** despliega cada serie; se abre así si las series ya son distintas. **"Todas iguales"** copia la primera en las demás.
  - **El resumen** (`model/prescription.ts`): "3 × 8-12 · RIR 1 · 2:00". Con series distintas, agrupa las iguales seguidas: "1 × 6-8 · RIR 1 + 2 × 10-12 · RIR 0 · 2:00". La carga se ve en la unidad del usuario ("22 lb"). Sin nada prescrito, la fila dice solo "3 series".
- **Por qué:** una línea visible sin abrir nada es lo más rápido para el caso normal (todas las series iguales), que es como trabaja el propietario.
- **Revisar si:** con 8 o 10 ejercicios por día la pantalla se hace larga en el móvil. Plegar el editor de cada ejercicio sería barato.

### D-103 · El ajuste RIR o RPE y la carga objetivo
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.10b que D-076 no fijaba.
  - **El ajuste se guarda en `tenants.settings`** como `intensityScale` (`rir` o `rpe`). Si falta o no vale, RIR. Lo lee cualquier miembro del negocio; solo lo cambia el dueño (ya lo garantizaba el RLS de `tenants`). No hace falta ninguna migración.
  - **Está en Ajustes → "Entrenamiento"**, solo para el dueño. Se guarda al elegir, sin botón.
  - **`core/tenancy`** ofrece `useTenantSettings()` y `useSaveTenantSettings()`. Al guardar un ajuste se conservan los demás, también los que esa versión de la app no conozca.
  - **En el editor,** el desplegable de intensidad ofrece la escala del ajuste. Lo escrito con la otra se sigue viendo y no se convierte.
  - **La carga** se escribe en la unidad del usuario (kg o lb), con coma o con punto y dos decimales como mucho, y se guarda en kg con dos decimales. Se enseña con un decimal como mucho: 10 kg son "22" en libras, y "22" en libras se guarda como 9,98 kg.
  - **En un ejercicio de peso corporal** el campo se llama "Lastre" (D-072).
- **Por qué:** los ajustes del negocio son preferencias (ARQUITECTURA §8) y ya tenían su sitio en la base de datos.
- **A tener en cuenta:** al pasar de libras a kilos y volver puede bailar el segundo decimal en kg. No se ve, porque se enseña con un decimal.

---

## Pendientes de decidir

| Nº | Qué | Cuándo hay que decidirlo |
|---|---|---|
| P-01 | **Cerrado el 2026-11-14.** El dominio es `athlete-core.com`, gestionado en Cloudflare. Los emails salen de `no-reply@athlete-core.com` (D-046) | — |
| P-02 | Nicho definitivo tras hablar con coaches. **Provisional desde el 2026-11-15** (D-070): coach de gimnasio, musculación y fuerza. El propietario hablará con 3–5 coaches cuando tenga la demo; las preguntas están en D-070 | Al terminar la Fase 3 y, en todo caso, antes de empezar la Fase 4 |
| P-03 | Hosting de la web: Vercel o Cloudflare Pages. Comprobar en ambos el coste con dos personas subiendo código y las condiciones de uso comercial | Antes de enseñar la app a coaches |
| P-04 | **Cerrado el 2026-11-15** por D-071: un catálogo de 120 ejercicios de la plataforma y una copia para cada negocio, que el coach edita como suya | — |
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
