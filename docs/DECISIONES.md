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

### D-104 · Cómo se copia y se duplica
- **Fecha:** 2026-11-15
- **Decisión:** detalles del PR 2.11 que D-080 no fijaba.
  - **Ejercicio:** "Duplicar" lo pone justo debajo con las mismas series, descanso y nota. "Copiar" lo guarda para pegarlo ("Pegar ejercicio") al final de otro día, de esta rutina o de otra.
  - **Día:** "Duplicar este día en…" con un desplegable de los demás días del ciclo. "Copiar día" y, en cualquier día (también de descanso), "Pegar aquí el día copiado". El destino queda igual que el original: tipo, nombre, subtítulo, lugar, ejercicios y series.
  - **Si el día de destino ya tiene ejercicios, se pregunta antes de sustituirlos,** tanto al duplicar como al pegar.
  - **Lo copiado se guarda en el dispositivo,** uno por usuario y negocio (los ejercicios son de cada negocio), con el prefijo de los borradores (D-099): se olvida al cerrar sesión. Copiar otra cosa sustituye a lo anterior.
  - **Plantilla:** "Duplicar" en la lista crea "Copia de …" (recortado a 80 caracteres), con todos sus bloques, y se queda en la lista.
  - **Toda copia nace sin identificadores:** al guardar, la base de datos la crea como algo nuevo. Cambiar la copia no cambia el original.
  - **Si lo pegado lleva un ejercicio archivado** que la rutina de destino no tenía, la base de datos no lo admite (D-073) y la app lo explica: "Recupéralo en Ejercicios o quítalo de la rutina".
- **Por qué:** el propietario pidió copiar a toda escala. Con el editor guardando un documento entero (D-079), copiar es mover piezas del documento sin tocar la base de datos hasta "Guardar cambios".

### D-105 · Cómo asigna la base de datos una rutina
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.12 que D-081 y D-083 no fijaban.
  - **"Hoy" lo dice el dispositivo del coach** (D-082), no el servidor: las funciones reciben esa fecha y solo la aceptan si está a un día, como mucho, de la fecha del servidor.
  - **La fecha de inicio** puede ser pasada o futura, hasta un año en cada sentido.
  - **Con fecha de hoy o pasada,** todas las rutinas ya empezadas y sin terminar del cliente quedan terminadas. No se borran.
  - **Con fecha futura, la próxima que hubiera se borra.** Nunca llegó a empezar: no tiene historia que guardar.
  - **Al asignar a varios, o todos o ninguno:** si un cliente no vale (dado de baja o de otro negocio), no se asigna a nadie. Como mucho, 100 clientes de una vez.
  - **Solo se asignan plantillas sin archivar.** La copia lleva el nombre de la plantilla y apunta de cuál salió.
  - **Una rutina vacía** para un cliente nace como una plantilla nueva: un bloque sin fecha de fin con todos sus días de descanso.
  - **Terminar y cancelar son dos operaciones distintas:** la vigente se termina (se guarda en "Anteriores"); la próxima se cancela (se borra). La rutina de un cliente dado de baja se puede terminar.
  - **Reiniciar** cambia la fecha y el bloque de una rutina sin terminar, y trata a las demás rutinas del cliente como al asignar: para hoy o antes, las ya empezadas quedan terminadas; para una fecha futura, sustituye a la próxima. Una rutina terminada no se reinicia: se asigna otra.
  - **Guardar como plantilla** copia la rutina del cliente entera, sin cliente ni fechas, con el nombre que escriba el coach. Cuenta para el tope de plantillas (D-086).
  - **En `audit_log`** quedan `program.assigned`, `program.created_for_client`, `program.ended`, `program.canceled`, `program.restarted` y `program.saved_as_template`, solo con identificadores.
- **Por qué:** con la fecha del servidor, un coach que asigna "para mañana" de noche podía dejar al cliente sin rutina unas horas por la diferencia horaria. Borrar la próxima sustituida evita acumular rutinas que nadie llegó a usar.
- **Revisar si:** los coaches echan de menos recuperar una "próxima" que sustituyeron por error.

### D-106 · Los ejercicios de un día se editan de uno en uno
- **Fecha:** 2026-11-16
- **Decisión:** pedido por el propietario al probar el lote 3.
  - En el editor, el día enseña **una fila con los números de sus ejercicios, en orden** (1, 2, 3…; solo los que hay), y debajo **solo el ejercicio elegido**, con todos sus campos.
  - Se cambia de ejercicio **tocando su número** o, en el móvil, **deslizando hacia los lados**. Con muchos ejercicios, la fila de números se desliza.
  - Al **añadir, pegar o duplicar** se pasa al ejercicio nuevo. Al **subir o bajar** uno, se sigue viendo ese. Al cambiar de día se empieza por el primero.
  - Quien usa lector de pantalla oye en cada número el nombre del ejercicio y su resumen.
- **Por qué:** con cada ejercicio desplegado, un día de 8 ejercicios obligaba a bajar mucho, sobre todo en el móvil.
- **Consecuencias:** ya no se ven los nombres de todos los ejercicios del día de un vistazo: el resumen sigue en la lista de días ("7 ejercicios · 20 series").
- **Revisar si:** los coaches echan de menos ver la lista entera con nombres.

### D-107 · La ventana de asignar y el calendario
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.13a que D-075, D-081 y D-082 no fijaban.
  - **"Asignar" es un botón en cada plantilla activa** de la lista. Abre una ventana: a pantalla completa en el móvil, centrada en el ordenador. Escape la cierra.
  - **Los clientes salen en una lista de casillas**, por nombre, con un buscador y la rutina que tiene ahora cada uno ("Tiene «Casa + Gym»" o "Sin rutina"). Solo los clientes activos.
  - **La fecha de inicio** es hoy por defecto y admite hasta un año hacia atrás o hacia delante (lo mismo que la base de datos, D-105). El modo es "Con calendario" por defecto.
  - **El resumen** dice cuándo empieza (si es una fecha futura), cuándo termina o "Se repite hasta que la cambies", y un aviso por cada cliente al que se le sustituye una rutina: la vigente, si empieza hoy o antes; la próxima, si empieza más adelante.
  - **El calendario cuenta días de calendario** ("AAAA-MM-DD") sin hora ni zona: hoy es la fecha del dispositivo (D-082) y los cambios de hora no mueven nada. Un bloque que no es el último y no tiene vueltas cuenta como 1 vuelta (la base de datos no lo permite; es solo por seguridad).
  - **En la semana a medias** de un bloque semanal (D-075) la vuelta es la 0 y toca el día de la semana de hoy.
- **Por qué:** el coach decide sin salir de la lista de plantillas y ve antes de confirmar a quién le cambia algo.

### D-108 · La pestaña "Asignadas"
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.13b que D-085 no fijaba.
  - **Es una tercera pestaña** en "Rutinas", junto a "Activas" y "Archivadas" (las de las plantillas), y sin número: así no cambia nada de lo que ya había.
  - **Cada cliente activo, por nombre,** con su rutina vigente en una línea: el bloque ("Bloque 2 de 3", solo si hay varios), la semana o la vuelta ("Semana 2 de 4" en un bloque semanal; "Vuelta 3 de 4" en los demás; "Semana de inicio" en la semana a medias) y cuándo termina, o "Sin fecha de fin". En modo lista se añade "Modo lista".
  - **Si el último bloque ya terminó y se repite,** en lugar de la vuelta dice "Terminada: se repite hasta que la cambies" (D-075).
  - **La próxima,** en una segunda línea con su fecha. Si no tiene vigente, "Sin rutina" y debajo la próxima.
  - Los clientes dados de baja no salen.
- **Por qué:** con 15 clientes, el coach ve de un vistazo quién está a punto de quedarse sin rutina (D-085).
- **Revisar si:** el coach quiere ordenar por "termina antes" o filtrar los que no tienen rutina.

### D-109 · Las pestañas de la ficha del cliente y la pestaña "Rutina"
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.14a.
  - **Las pestañas las reparte la carcasa del coach** con un contexto de `src/core/modules`: la ficha (módulo clients) las lee con `useClientProfileTabs()` y pinta la elegida con `ClientProfileTabContent`, sin importar ningún módulo (ARQUITECTURA §6). Cada pestaña recibe el cliente (`clientId`, `clientName`, `isActive`). Su código se carga la primera vez que se abre.
  - **Con una sola pestaña también se ve el botón**, para que el coach sepa dónde está y para cuando llegue "Progreso" (Fase 3).
  - **La pestaña "Rutina"** enseña la actual (nombre; por dónde va, como en "Asignadas", D-108; el modo; la fecha de inicio; y los días del bloque en que va, con el de hoy marcado si es con calendario), la próxima con su fecha y las anteriores con sus fechas, de la más reciente a la más antigua.
  - **El editor de la rutina de un cliente** dice "Rutina de Ana" encima del nombre, y su enlace de volver lleva a la ficha de Ana.
  - **Cliente dado de baja:** se ven sus rutinas, sin "Editar" ni acciones, con "Reactívalo para asignarle una rutina" (D-083).
- **Por qué:** la ficha no puede depender de programs; con el contexto, una función nueva añade su pestaña desde su manifest y nada más.

### D-110 · Las acciones de la pestaña "Rutina"
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.14b.
  - **Los botones van debajo de la rutina actual y la próxima**, todos a la vista: "Asignar una plantilla" y "Crear desde cero" siempre; "Reiniciar desde una fecha", "Guardar como plantilla" y "Terminar" si hay rutina actual; "Cancelar la próxima" si hay próxima. Se abre uno cada vez, debajo.
  - **"Asignar una plantilla"** es la ventana del PR 2.13 con el cliente ya elegido y un desplegable de plantillas activas, por orden alfabético.
  - **"Crear desde cero"** pide nombre, días del ciclo (7 por defecto), fecha de inicio y modo, y abre el editor: la rutina nace con todos los días de descanso (D-105).
  - **"Reiniciar desde una fecha"** pide la fecha (hoy por defecto) y, si hay varios bloques, el bloque (por defecto, en el que iba). Si la fecha es futura, la rutina pasa a ser "Próxima" hasta ese día.
  - **"Guardar como plantilla"** propone el nombre de la rutina; se puede cambiar.
  - **"Terminar" y "Cancelar la próxima" piden confirmación** y dicen qué pasa: la terminada pasa a Anteriores; la cancelada se borra.
  - Tras cada acción, un aviso en la pestaña.
- **Por qué:** el coach gestiona cada cliente desde su ficha sin buscar en otra pantalla.

### D-111 · "Entreno", lo que ve el cliente
- **Fecha:** 2026-11-16
- **Decisión:** detalles del PR 2.15 que D-084 no fijaba.
  - **"Entreno" va justo después de "Inicio"** en la barra del cliente.
  - **Tres niveles en la misma pantalla, con la dirección:** la rutina (`/client/program`), un día (`?day=3`) y un ejercicio (`?day=3&exercise=1`). Así "atrás" del móvil vuelve al nivel anterior y se puede compartir o recargar.
  - **"Hoy toca"** enseña el día, su nombre, subtítulo y lugar, y cuántos ejercicios y series tiene; es un enlace al día. En un día de descanso, "Hoy: descanso".
  - **En modo lista** solo salen los días de entreno, con su nombre (o "Día N"), sin fechas ni "Hoy toca" (D-082).
  - **Cada serie en una línea:** "Serie 1: 6-8 · RIR 1 · 10 kg", con el resumen del PR 2.10 de esa sola serie. El descanso va debajo, una vez.
  - **"Ver vídeo"** abre el enlace en otra pestaña, fuera de la app (D-074).
  - **Una rutina que aún no ha empezado** (próxima o reiniciada con fecha futura) dice "Tu rutina empieza el…" con su nombre debajo.
  - El cliente lee los ejercicios de sus rutinas con la política del PR 2.5b (D-072): el módulo exercises da su nombre en el idioma del cliente, sus instrucciones y su vídeo.
- **Por qué:** el cliente abre la app y en un toque sabe qué le toca hoy; nada que aprender.

### D-112 · Los bloques en el editor
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 2.16 que D-075 no fijaba.
  - **Con un solo bloque no sale la fila de bloques:** solo su duración y "Añadir bloque". Con varios, una fila de botones ("Bloque 1 · 4 semanas") elige cuál se edita; debajo, su nombre, su duración y sus acciones.
  - **La duración** se elige con atajos de 1, 2 y 4 (semanas si el ciclo es semanal; vueltas si no), escribiendo las vueltas (1 a 52) o, solo en el último bloque, "Sin fecha de fin". Debajo dice cuántos días son.
  - **Si un bloque sin fin deja de ser el último** (al añadir otro detrás o al moverlo), pasa a durar 4 vueltas, y el coach lo cambia si quiere. La tarea decía "el editor pide la duración": se optó por un valor por defecto a la vista en lugar de una pregunta que corta lo que se estaba haciendo.
  - **"Duplicar el anterior"** copia el último bloque con su duración; "Bloque vacío" nace semanal y con todos los días de descanso. También se duplica cualquier bloque y se copia para pegarlo en otra rutina (con el portapapeles del PR 2.11).
  - **Quitar un bloque pide confirmación.** El único bloque no se puede quitar.
  - **El bloque abierto va en la dirección** (`?block=2&day=3`), como el día.
  - **El cliente** ve solo el bloque en que va y, si hay otro detrás, "El siguiente bloque empieza el…" (D-084).
- **Por qué:** una rutina de un bloque, que es lo normal, se edita igual que antes; los bloques solo ocupan sitio cuando se usan.

### D-113 · Cómo se agrupan los ejercicios
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 2.17 que D-077 no fijaba.
  - **"Agrupar con el siguiente"** junta un ejercicio con el de debajo. Si alguno ya estaba en un grupo, los grupos se unen. El botón no sale en el último ejercicio ni si ya van juntos.
  - **"Desagrupar"** suelta a todos los del grupo, no solo a ese ejercicio.
  - **Un grupo es un tramo de ejercicios seguidos.** Tras mover, quitar, sustituir, duplicar o pegar, el día se ordena solo: un ejercicio que sale de su tramo queda suelto; un grupo de uno deja de serlo; duplicar uno agrupado mete la copia en el grupo. Los grupos se numeran por orden (hasta 15 por día).
  - **La marca** dice el tipo y el puesto: "Superserie · 1 de 2", "Circuito · 2 de 3". En la fila de números del editor, los agrupados llevan una raya debajo.
  - **El cliente** ve la misma marca en la lista de su día. El descanso sigue siendo el de cada ejercicio: no hay un descanso propio del grupo.
- **Por qué:** el coach no tiene que cuidar los grupos al reordenar; la app los mantiene con sentido.

### D-114 · Las tarjetas del inicio
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 2.18 que D-084 y D-085 no fijaban.
  - **El manifest gana `homeCards`:** por cada perfil (coach y cliente), una lista de tarjetas con su clave, su orden y su componente, que se carga al pintarlo. Es obligatorio en todos los módulos, como `clientProfileTabs`; los que no aportan nada lo dejan vacío. Las páginas de inicio (`src/app`) las pintan por orden con `HomeCardContent`, sin importar ningún módulo. Si una tarjeta no se puede cargar, no sale y el error queda registrado: el inicio sigue sirviendo. **Pendiente de que el propietario lo vea** (la tarea lo pedía); el ejemplo de ARQUITECTURA §5 no se ha tocado.
  - **Los avisos del coach, uno por cliente como mucho** y por urgencia: "Sin rutina"; "Terminada: se repite hasta que la cambies"; "Termina la rutina el…" si faltan 7 días o menos. Una rutina sin fecha de fin no avisa, y un cliente con una próxima ya asignada tampoco.
  - **Sin clientes todavía, la tarjeta de avisos no sale:** de eso se ocupan los primeros pasos. Mientras carga, tampoco.
  - **La tarjeta del cliente** dice el día de hoy con su nombre y cuántos ejercicios y series tiene, y lleva a ese día; en descanso, "Hoy: descanso"; en modo lista, el nombre de su rutina; sin rutina o con la rutina por empezar, lo mismo que "Entreno".
  - **Se quitan los textos provisionales** de los dos inicios ("llegará en las próximas fases").
- **Por qué:** cada inicio enseña lo que hay que hacer hoy, y una función nueva puede añadir su tarjeta desde su manifest sin tocar las carcasas.
- **Revisar si:** el coach quiere elegir con cuántos días de margen se le avisa.

### D-115 · Cómo se trabaja la Fase 3: diseño antes, 18 PR en 5 lotes
- **Fecha:** 2026-11-16
- **Decisión:** la Fase 3 se diseñó entera en un chat de diseño, sin código (D-115 a D-136), y su plan está en `docs/PROMPTS.md` §7. Se trabaja como la Fase 2 (D-069):
  - **18 PR, del 3.1 al 3.18, en 5 lotes** de 3 o 4. Cada lote termina en algo que el propietario prueba en la app del móvil.
  - **Un lote no empieza hasta que el anterior está fusionado en `main`** con el visto bueno del propietario (D-068).
  - **Unas 300 líneas de verdad por PR**; si va a pasar de 400, se parte como dice su bloque. Lo que se genera solo (`database.types.ts`, el proyecto `android/`) no cuenta.
  - **La base de datos va en PR propios, antes que las pantallas** (3.2 y 3.3).
- **Por qué:** funcionó en la Fase 2: los errores de diseño se vieron con 4 PR hechos y no con 18.

### D-116 · Entrenar, solo en la app del móvil
- **Fecha:** 2026-11-16
- **Decisión:** aclara D-001. La app sigue siendo una sola, con el mismo código, en la web, en iOS y en Android, y coaches y clientes entran en las tres. **Lo único que no se puede hacer en la web es empezar o registrar un entreno** (ni corregir uno ya guardado): eso solo se hace en la app del móvil.
  - En la web, el cliente ve su rutina, su semana, su historial, su progreso y sus ajustes, y puede apuntar su peso corporal y sus medidas (no son un entreno). Donde en el móvil sale "Iniciar entreno", en la web sale "Para entrenar, abre la app en tu móvil".
  - El coach usa la web y la app del móvil igual. Más adelante puede haber una app de escritorio.
  - Si se puede registrar un entreno lo decide `core/native` (¿estamos en la app instalada?). **En desarrollo y en los tests** se puede activar en el navegador con una variable de entorno; nunca en la web publicada.
- **Por qué:** decisión del propietario. Guardar sin conexión de forma segura y avisar del descanso con la pantalla apagada solo se puede hacer bien con la app instalada. Además, así el límite de Safari (borra lo guardado tras unos 7 días sin abrir la web, y en modo privado no guarda) no afecta a ningún entreno.
- **Consecuencias:** se aclara en AGENTS.md §1, ARQUITECTURA §1, §12 y §14, README.md, CONTEXTO.md y ESTADO.md, con la aprobación del propietario. El propietario primero dijo "nada de web, nunca" y lo corrigió en el mismo chat: fue un error de interpretación.

### D-117 · La app de Android llega en la Fase 3
- **Fecha:** 2026-11-16
- **Decisión:** el proyecto nativo de Android se crea en el primer PR de la Fase 3 (3.1), y el propietario instala la app en su móvil Android con un archivo que le pasa el agente. **iOS sigue en la Fase 4**, porque necesita compilarse en la nube (P-08). El propietario tiene a mano un iPhone los fines de semana para probarlo entonces.
- **Por qué:** entrenar solo se puede en la app (D-116); sin ella, el propietario no podría probar ningún lote de la Fase 3.
- **Consecuencias:** en ESTADO, "Proyectos nativos de Android e iOS" de la Fase 4 se queda solo en iOS. Publicar en Google Play sigue en la Fase 4.

### D-118 · Guardado en el móvil, sin conexión
- **Fecha:** 2026-11-16
- **Decisión:** cierra P-06 para los entrenos y ajusta D-061.
  - **Todo lo que el cliente apunta se guarda en el móvil al instante**, haya conexión o no, y se sube solo a la nube cuando la hay. No se pierde nada si la app se cierra sin querer, si se quita de la multitarea o si el móvil se apaga del todo.
  - **Se guarda en el almacén del propio teléfono** (`@capacitor/preferences`, D-135), que el sistema no borra, y no en el del navegador.
  - **Lo que se descarga para entrenar sin cobertura:** la rutina vigente entera y, de cada ejercicio, lo que hizo el cliente la vez anterior. Se pone al día cada vez que se abre la app con conexión, así el entreno de hoy ya está en el móvil antes de bajar al sótano.
  - **La subida es segura de repetir:** cada entreno y cada serie llevan un identificador que crea el móvil, así subir dos veces lo mismo no lo duplica.
  - **Mientras haya algo sin subir**, el cliente lo ve ("Pendiente de subir") y cerrar sesión pregunta antes ("Tienes entrenos sin subir. Si cierras sesión, se perderán").
  - **Si la sesión caduca** (30 días, D-045) con datos sin subir, se quedan en el móvil y se suben al volver a entrar con la misma cuenta.
  - **Si el coach lo dio de baja** antes de subirlos, la base de datos los rechaza y el cliente ve "No se pudo guardar: ya no tienes acceso a …".
  - **El resto de la app** sigue con D-061: sin conexión se ve lo ya cargado y los formularios dicen "No hay conexión".
- **Límite:** si se desinstala la app o se borran sus datos desde los ajustes del teléfono con algo sin subir, eso se pierde.
- **Por qué:** es lo más importante de la fase y lo que más molestaba al propietario de Strong y Hevy: perder el entreno al cerrar la app o al apagarse el móvil.

### D-119 · Iniciar, reanudar y cerrar un entreno
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Iniciar:** desde "Hoy toca" (en el inicio o en "Entreno") o desde cualquier día de la rutina. Solo hay **un entreno abierto a la vez**; para empezar otro hay que cerrar el que está abierto.
  - **Con un entreno abierto, al abrir la app se va directo al ejercicio que toca**: el último que se tocó si le quedan series, o el siguiente con series pendientes.
  - **Se cierra solo** cuando todos los ejercicios del día tienen todas sus series hechas, o están saltados. Sale el resumen: duración, series hechas, minilogros y récords.
  - **"Terminar entreno"** cierra a mano en cualquier momento. **"Descartar entreno"** lo borra, con confirmación.
  - **A las 6 horas** de la última serie apuntada, el móvil manda un recordatorio: "Tienes un entreno abierto. Termínalo, apunta lo que hiciste o marca lo que saltaste". Lo programa el propio móvil (notificación local, D-135), sin cobertura y sin servidor.
  - **A las 12 horas** sin tocarlo se cierra solo, y al abrir la app se ve "Guardamos tu entreno del lunes".
  - **La fecha del entreno es la del último dato cambiado**, en la zona horaria del móvil: si entrenó el lunes y lo cierra el martes, queda como entreno del lunes.
  - **Un entreno sin ninguna serie hecha** no se guarda al cerrarlo.
  - **El calentamiento no se apunta**: solo las series efectivas.
- **Por qué:** así entrena el propietario: abre la app ya en el gimnasio y quiere estar en el ejercicio en un toque.
- **Consecuencias:** la tarjeta "Hoy toca" del inicio del cliente pasa de `programs` a `workouts` (que usa a `programs`), con "Iniciar entreno" o "Continuar". En los días de "Entreno", `programs` enseña un enlace a la ruta de `workouts`, sin importar el módulo.

### D-120 · Apuntar una serie
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Un ejercicio por pantalla**, con sus series. Se pasa al siguiente deslizando o con la fila de puntos de arriba, y desde el resumen del día.
  - **Peso, repeticiones e intensidad**, cada uno con botones − y + grandes y, al tocar el número, con teclado. Pasos: 2,5 kg (o 5 lb), 1 repetición, 1 de RIR o 0,5 de RPE. La intensidad es RIR o RPE según el ajuste del coach (D-103), y "F" es al fallo. Los ejercicios de tiempo piden segundos y los de distancia, metros (D-072). El peso se escribe en la unidad del cliente y se guarda en kg.
  - **No hay botón "Marcar serie hecha":** la serie **se ilumina con el color de la marca** en cuanto se cambia cualquiera de sus datos o se pulsa "Igual". Tocando una serie iluminada, se desmarca. Las no iluminadas no cuentan.
  - **En gris, lo de la vez anterior en esa misma serie**: la última vez que hizo ese ejercicio **en ese mismo día de la rutina** (lunes con lunes), porque el mismo ejercicio puede ir pesado un día y a más repeticiones otro. Si no lo ha hecho en ese día, lo de la última vez en cualquier día; si nunca lo ha hecho, lo que prescribió el coach.
  - **Botón "Igual"**: por defecto copia lo gris (la vez anterior en esa serie). Un ajuste del cliente, en su Perfil, lo cambia a: la serie 1 copia la vez anterior, y las siguientes copian la serie anterior de hoy. La primera vez, sin nada que copiar, no sale.
  - **"+ Serie"** añade una serie más que las prescritas (hasta 10, D-086).
  - **"¿Seguro?"**: si el peso cambia más de un 50 % respecto a la vez anterior ("La vez anterior fueron 35 kg"), se pregunta antes de aceptarlo.
  - **Botones de 44 px o más**, usables con una mano y sudando.
- **Por qué:** el propietario apunta justo después de cada serie, con el móvil en la mano unos segundos. Un botón para confirmar era un paso de más ("es un lío"). Un dato mal escrito estropeaba sus gráficas.

### D-121 · Unilaterales, superseries y circuitos al entrenar
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Unilaterales:** cada serie tiene derecha e izquierda, cada una con su peso, repeticiones e intensidad. "Igual" copia los dos lados. El descanso arranca cuando están apuntados los dos.
  - **Superseries y circuitos (D-113):** al apuntar una serie de un ejercicio del grupo, la app pasa al siguiente del grupo en la misma serie. El descanso arranca al acabar la ronda (la serie del último del grupo).
- **Por qué:** el propietario apuntaba solo el lado más débil y sabía que era un error (D-072).

### D-122 · Cambiar o saltar un ejercicio, notas y set-up
- **Fecha:** 2026-11-16
- **Decisión:**
  - **"Cambiar ejercicio"** (máquina ocupada, otro gimnasio): elige otro ejercicio del negocio, solo para ese entreno; la rutina del coach no cambia. Lo apuntado **cuenta para el ejercicio que se hizo de verdad**, así la gráfica del original no se ensucia. El coach ve "Cambiado por …".
  - **"Saltar ejercicio"**: lo marca como saltado. El coach lo ve.
  - **Nota del día**, una por ejercicio en cada entreno: "Dolor de hombro, por eso tiré menos", "No había discos". Es dato de salud (D-126).
  - **Set-up del cliente**, uno por ejercicio y compartido entre todas sus rutinas: "Asiento 2 · Agarre línea 3 · Pies juntos". Lo ve el coach, que no lo edita.
  - **Lo del coach** se ve en el mismo sitio: las instrucciones del ejercicio (las mismas para todos sus clientes) y la nota del ejercicio en la rutina (D-076).
- **Por qué:** por la tarde es normal encontrar la máquina ocupada; si el coach ve que un ejercicio se cambia semana tras semana (D-128), cambia la rutina. El set-up depende del gimnasio y de la máquina de cada cliente.

### D-123 · El cronómetro de descanso
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Arranca solo con el primer cambio de una serie** (o con "Igual"). Corregir esa misma serie no lo reinicia.
  - **Qué descanso usa:** el que puso el coach en ese ejercicio; si no puso, el del cliente en sus ajustes (2:00 de partida). Si el cliente lo cambia a mano en el entreno, vale **solo para ese entreno** (por si iba con prisa) y no se recuerda. Nunca cambia la rutina del coach.
  - **Es de toda la app:** una barra fija siempre a la vista mientras sigue apuntando, aunque cambie de ejercicio. Se puede pausar, parar, saltar y sumar o restar 15 segundos.
  - **Al llegar a cero:** sonido corto, vibración y una notificación, **también con la pantalla apagada o en otra app** (notificación local, D-135). El sonido de la notificación deja que el sistema baje la música un momento; se comprueba en el móvil del propietario y, si no lo hace, se anota como mejora.
  - **La cuenta sigue bien** al volver a la app: se calcula con la hora de inicio, no contando segundos.
  - **Ajustes del cliente** (Perfil → "Entreno"): descanso por defecto, arrancar el descanso solo (activado por defecto), sonido y vibración.
  - Superseries, circuitos y unilaterales: D-121.
- **Por qué:** al propietario le fallaban las notificaciones en otras apps; con la app instalada, la alarma la programa el propio móvil.

### D-124 · Corregir, dos móviles y cambios del coach a mitad
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Corregir:** el cliente corrige un entreno cerrado desde su historial, en la app, durante **7 días**. Después queda solo para leer. El coach ve "Editado". El coach no edita los entrenos de sus clientes.
  - **El mismo entreno en dos móviles:** un entreno abierto vive en un solo móvil. Si se abre en otro, sale "Este entreno está abierto en otro dispositivo" con "Seguir aquí". Si los dos guardaron cosas sin conexión, al subir se queda, en cada serie, el último cambio.
  - **Si el coach cambia la rutina mientras el cliente entrena** (con o sin conexión), el entreno empezado sigue con la rutina que tenía al empezar. El cambio se ve en el siguiente entreno. El entreno guarda su propia copia de lo prescrito (D-087).
  - **Qué ve el coach de un entreno a medias:** lo que ya se ha subido, con la marca "En curso". Lo que sigue en el móvil sin subir, no lo ve.
- **Por qué:** es lo que hace la app de apuntes del propietario, y nada cambia a mitad de una serie.

### D-125 · El día saltado: tres reglas, las elige el coach
- **Fecha:** 2026-11-16
- **Decisión:** completa D-082. Un día de entreno está **faltado** cuando pasa su fecha sin un entreno de ese día de la rutina. Queda apuntado siempre. El coach elige para cada cliente, en la pestaña "Rutina", una de estas reglas (por defecto, la primera):

  | Regla | Qué pasa si falta el lunes |
  |---|---|
  | **Se pierde** | El martes toca lo del martes. Puede abrir el lunes y hacerlo igual: queda "Lunes, hecho el martes" |
  | **Se recupera en el siguiente descanso** | El siguiente día de descanso pasa a ser "Hoy toca: Lunes (recuperar)". Si falta más de uno, se recuperan por orden |
  | **Se mueve todo** | El martes toca lo del lunes, y el resto del calendario (y el fin de cada bloque) se retrasa un día |

  - El cambio de regla vale desde el día en que se cambia; no recalcula el pasado.
  - Una rutina **próxima** sigue empezando en su fecha, aunque la vigente se haya movido.
  - **En modo lista**, el bloque avanza por **entrenos hechos**, no por fechas: un bloque de 4 vueltas de un ciclo con 4 días de entreno dura 16 entrenos. Cierra la duda de D-082.
- **Por qué:** cada coach trabaja distinto: unos quieren que se recupere a costa de un descanso, otros (como el propietario con su ciclo de 8 días) mueven todo un día, y otros que se salte y ya. Cada entreno guarda su día de la rutina y su fecha, así cualquier regla nueva que pidan los coaches se puede calcular sin rehacer tablas.
- **Consecuencias:** los días faltados se guardan en la base de datos del lado de las rutinas, así `programs` ("Hoy toca", "Asignadas", los avisos) los lee sin importar `workouts` (ARQUITECTURA §6). Los apunta la app del cliente al abrirse, con la fecha del móvil (D-105); si el cliente no abre la app, el coach no ve el retraso hasta que la abra.
- **Revisar si:** los coaches piden otra regla. Añadirla es barato.

### D-126 · Datos de salud y menores (P-12)
- **Fecha:** 2026-11-16
- **Decisión:** cierra P-12 para la Fase 3; la edad de los menores queda provisional.
  - **Qué es dato de salud en esta fase:** el peso corporal, las medidas corporales y las notas del día (pueden decir "me duele el hombro"). No lo son las series, los pesos levantados, el set-up ni los logros.
  - **Consentimiento:** se pide **una vez, al entrar por primera vez en el espacio de cada coach** (y a los clientes que ya existen, la primera vez que abran la app tras este cambio). Texto en borrador: "Tu peso, tus medidas y las notas que escribas (que pueden incluir molestias o lesiones) son solo entre tú y tu coach, para que pueda mejorar su servicio y su asesoramiento. ATHLETE CORE los guarda por encargo de tu coach y no los usa para nada más. Puedes retirar este permiso cuando quieras en tu Perfil". Botones "Acepto" y "Ahora no".
  - Se guarda por espacio, con la fecha y la versión del texto. El coach ve si su cliente lo ha dado.
  - **Sin consentimiento** se entrena igual, pero no se apuntan peso, medidas ni notas del día, y el lastre no se suma al peso corporal. Al intentar apuntarlos, se vuelve a pedir.
  - **Retirarlo** (Perfil) borra el peso, las medidas y el texto de las notas del día de ese espacio, con confirmación.
  - **Así será toda la app:** lo que llegue después (fotos, check-ins) usará este mismo consentimiento, ampliando el texto.
  - **Menores (provisional):** la casilla de 16 años del registro no cambia (D-060) hasta tener los textos legales definitivos (Fase 4). Entonces se decide con un abogado; la propuesta es 14 años en España, 13 en el Reino Unido y EE. UU., 16 en el resto de Europa y nunca menos de 13.
- **Por qué:** en Europa, los datos de salud piden un permiso expreso y aparte. Pedirlo una vez, al principio, molesta menos que en mitad de un entreno.
- **Depende de un profesional:** el texto del consentimiento, la base legal y la edad de los menores los revisa un abogado junto a los textos legales de la Fase 4. Mientras, ningún usuario real entra (D-060).

### D-127 · Peso corporal y medidas
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Peso corporal:** el cliente lo apunta cuando quiere, con fecha, en la app o en la web. Se ve el último ("85 kg · apuntado el 16 nov"), "Actualizar" y el historial con su gráfica. Se guarda en kg.
  - **Lastre:** en los ejercicios de peso corporal se apunta el lastre (D-087) y, con consentimiento, se ve el total ("Lastre 10 · Total 95 kg"), que es el que cuenta para el RM y los récords. Sin consentimiento, solo el lastre.
  - **Medidas:** lista fija, todas opcionales: cintura, cadera, pecho, hombros, cuello, brazo, muslo y gemelo (estos tres, derecho e izquierdo). En cm (o pulgadas si usa libras). Con fecha, historial y gráfica de cada una.
  - **El coach** ve el peso y las medidas de sus clientes que hayan dado el consentimiento.
  - **Sin fotos** en la Fase 3: llegan con los check-ins.
- **Por qué:** el peso corporal sirve para la salud y el control, y hacer las mismas repeticiones pesando más es un avance. El propietario pidió un apartado de medidas.
- **Consecuencias:** el peso y las medidas los lleva el módulo `workouts`, que los necesita para el total con lastre; `progress` los lee por su `index.ts`. El consentimiento es de cada espacio y lo usan varios módulos: va en `core/tenancy`.

### D-128 · Lo que ve el coach
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Tarjeta "Actividad"** en su inicio, lo último arriba: "Ana terminó *Lunes* · 2 récords · cambió 1 ejercicio · 1 nota". Lo que no ha abierto va marcado. Cada línea lleva a ese entreno.
  - **Avisos nuevos** en la tarjeta de avisos (D-114): "Sin entrenar desde hace 7 días" y "Cambió *Press horizontal* 3 veces en 4 semanas".
  - **Pestaña "Entrenos"** en la ficha del cliente: sus entrenos, del más nuevo al más viejo, con fecha, día de la rutina, series hechas y las marcas "En curso", "Editado" y "Faltado".
  - **Un entreno, por dentro:** cada ejercicio con sus series como en el Excel ("45×8(1) / 45×7(1)"), una flecha frente a la vez anterior, las notas del día, el set-up, lo cambiado y lo saltado, los récords y la duración.
  - **En la misma ficha:** su peso corporal y sus medidas (D-127), y si dio el consentimiento.
  - **Sin comentarios** del coach sobre un entreno: llegan con el chat. Entonces, "Comentar" en un entreno abre el chat con el cliente, y el cliente ve que le escribe "sobre tu entreno del lunes".
  - Sin emails ni notificaciones al coach (P-07).
- **Por qué:** con 15 clientes, el coach tiene que ver de un vistazo quién entrena, quién no y qué le pasa a cada uno.

### D-129 · Progreso: historial, RM estimado, récords y gráficas
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Historial de cada ejercicio** en texto, como en la app de apuntes: "DIA 1: 45×8(1) / 45×7(1) / 45×6(0)", con fecha y una marca si hay nota. "(F)" es al fallo. Agrupado por rutina, y con las rutinas anteriores.
  - **RM estimado:** fórmula de Epley, peso × (1 + repeticiones ÷ 30), sumando el RIR a las repeticiones (80 × 8 con RIR 2 se calcula como 80 × 10). Con RPE, RIR = 10 − RPE. **No se calcula con más de 12 repeticiones** (contando el RIR), porque deja de ser fiable. Se calcula, no se guarda: cambiar la fórmula es barato.
  - **Récords** de cada ejercicio: peso máximo y RM estimado más alto. En los de peso corporal, con el total (D-127).
  - **Gráficas** de cada ejercicio: peso máximo, RM estimado, volumen (peso × repeticiones) y repeticiones totales de cada entreno, con último, récord y progreso. Se elige el periodo: 4 semanas, 3 meses o todo.
  - **El % de progreso compara el RM estimado**, no el peso suelto, del primer al último entreno del periodo. Junto a "¿Seguro?" (D-120), un dato mal escrito ya no da "−83 %".
  - **Los ejercicios cambiados** (D-122) cuentan para el ejercicio que se hizo.
  - Lo ve el cliente en "Progreso" (app y web) y el coach en la ficha de cada cliente.
- **Por qué:** es lo que tiene la app de apuntes del propietario, que lo usa a diario; y en sus pruebas un solo dato mal escrito estropeaba el progreso.

### D-130 · Motivación: minilogros, racha, niveles y logros
- **Fecha:** 2026-11-16
- **Decisión:**
  - **Minilogro** al apuntar una serie que mejora a la misma serie de la vez anterior (el gris de D-120): más peso, o más repeticiones con el mismo peso o más. Ejemplo: antes 80×12, 80×10, 75×12; hoy 80×13 (minilogro), 80×10 (nada), 80×9 (minilogro: más peso).
  - **Récords** (D-129) celebrados al momento y en el resumen del entreno.
  - **Racha:** semanas seguidas completas. Una semana es completa si hizo tantos entrenos como días de entreno tenía esa semana su rutina. En modo lista, los días de entreno del ciclo repartidos por semana (un ciclo de 8 días con 5 de entreno pide 4 por semana).
  - **Niveles** por entrenos terminados (1, 5, 10, 25, 50, 100…), con nombre. **Logros**, unos 18 (primer entreno, primera semana completa, 10, 25, 50 y 100 entrenos, primer récord, 4 y 12 semanas seguidas…). Las listas exactas, en el bloque del PR 3.17.
  - Se calcula todo a partir de los entrenos; no hace falta guardarlo aparte.
  - **Activado por defecto.** El dueño del negocio lo apaga en Ajustes → "Entrenamiento" (se guarda en `tenants.settings`, que solo guarda preferencias).
  - **Sin muñeco ni mascota.**
- **Por qué:** al propietario le motiva ver que sube; y "lo que se pueda hacer ahora, ahora". Las tarjetas de récords para Instagram van después (D-134).

### D-131 · Descargar en Excel
- **Fecha:** 2026-11-16
- **Decisión:** en el último PR de la fase. Un archivo Excel con el formato de la app de apuntes del propietario: una hoja "Día a día" (fecha · rutina · día; cada ejercicio con sus series "45X8(1)" y la nota), una hoja por rutina (cada ejercicio con sus entrenos: día, fecha, series y nota) y una hoja "Peso corporal" (si hay consentimiento). Lo descarga el cliente con sus datos y el coach con los de cada cliente, en la app y en la web. Librería `write-excel-file` (D-135).
- **Por qué:** el propietario lo usa y lo enseña a quien quiera; y adelanta parte de "descargar los propios datos" (D-060).

### D-132 · Los 100 primeros coaches
- **Fecha:** 2026-11-16
- **Decisión:** completa D-016. Hasta tener 100 coaches, lo que pida un coach se valora con prioridad y con un plazo objetivo corto. **Siempre se construye para todos**: una mejora general o una función activable con un flag; nunca código para un coach concreto (AGENTS.md, regla de oro 4). A partir de los 100 coaches, las mejoras se deciden por voto general.
- **Por qué:** los primeros coaches dicen qué falta de verdad, y atenderlos rápido es la mejor venta. Hacerlo para todos mantiene una sola base de código.
- **Consecuencias:** no cambia AGENTS.md. El plazo concreto y si depende del plan se decide en la Fase 5, con los precios.

### D-133 · La marca, para todos los planes
- **Fecha:** 2026-11-16
- **Decisión:** se confirma D-057: el logo, los colores y el nombre de la marca del coach están en todos los planes, sin excepción. No se cambia al fijar los precios.
- **Por qué:** que el cliente sienta que entra en la app de su coach es el corazón del producto.

### D-134 · Ideas de negocio y Fase 6
- **Fecha:** 2026-11-16
- **Decisión:** las ideas que salieron hablando con Gemini se guardan en `docs/referencia/ideas-de-negocio.md`, marcadas como ideas y no decisiones, con lo decidido de cada una:
  - **Precios y planes:** en la Fase 5, después de hablar con coaches (D-017 y la pregunta 11 de D-070).
  - **Directorio público de coaches:** sigue el no (D-053) hasta tener decenas de coaches.
  - **Modo Alumni** (el exalumno sigue por libre, pagando, y el coach se lleva una parte): aprobado como idea. Necesita pagos y cambia D-055: después de la Fase 5. Hay que comprobar las normas de pago de Apple y Google para ese caso.
  - **Retos gratuitos y pase para un amigo:** aprobados como idea. Duran unos días, no gastan plazas del plan y sirven para atraer y retener. Después de la Fase 5.
  - **Tarjetas de récords para Instagram:** después de la Fase 3 (necesitan generar una imagen con la marca del coach y compartirla desde el móvil).
  - **Chat, nutrición, hábitos, check-ins, fotos y subir vídeos:** a futuro, cada uno en su fase. **Hosting, vídeos, notificaciones y demás servicios:** se eligen en su fase.
  - Se crea la **Fase 6 — Crecimiento** en ESTADO: Modo Alumni, retos, pase para un amigo, embajadores, tarjetas de récords y el directorio (con su condición).
- **Por qué:** son buenas ideas para crecer, pero ninguna hace falta para validar el producto con los primeros coaches.

### D-135 · Librerías de la Fase 3
- **Fecha:** 2026-11-16
- **Decisión:** el propietario aprueba estas librerías (AGENTS.md, regla 10):

  | Librería | Para qué |
  |---|---|
  | `@capacitor/android` | La app de Android (D-117) |
  | `@capacitor/local-notifications` | Alarma del descanso y recordatorio de las 6 horas, programados por el móvil |
  | `@capacitor/haptics` | Vibración |
  | `@capacitor/preferences` | Guardar el entreno en el almacén del teléfono (D-118) |
  | `@capacitor/app` | Saber cuándo se vuelve a la app, para el cronómetro y la subida |
  | `write-excel-file` | El Excel (D-131) |

  - **Autorización amplia para esta fase:** el propietario autoriza además las librerías que hagan falta para construir la Fase 3. El agente que añada una la anota aquí con su porqué, antes de instalarla, y lo dice en la descripción del PR. Las versiones, en "Versiones instaladas".
  - **Las gráficas se dibujan sin librería** (SVG propio).
- **Por qué:** las de Capacitor son las oficiales del marco que ya usamos; `write-excel-file` es pequeña y solo escribe.
- **Revisar si:** las gráficas se quedan cortas: entonces se propone una librería.

### D-136 · Qué queda fuera de la Fase 3
- **Fecha:** 2026-11-16
- **Decisión:** nada de esto se construye en la Fase 3:
  - **Fase 4:** la app de iOS, publicar en las tiendas, los textos legales definitivos (con el consentimiento y la edad de los menores de D-126), borrar la cuenta y los datos.
  - **Con el chat:** comentar un entreno (D-128).
  - **Fase 6:** tarjetas de récords para Instagram, Modo Alumni, retos, pase para un amigo, embajadores y directorio (D-134).
  - **Más adelante, cada uno en su fase:** fotos y check-ins, notificaciones al coach (P-07), app de escritorio para el coach, porcentaje del RM y tempo (D-076), nutrición, hábitos, pagos e importar el historial de otras apps.
- **Por qué:** la fase ya es la más grande; cada cosa de esta lista se puede añadir después sin rehacer lo de la Fase 3.

### D-137 · La app de Android de pruebas
- **Fecha:** 2026-11-16
- **Decisión:** cómo funciona la app de Android desde el PR 3.1:
  - **Un solo archivo de pruebas, contra staging:** `npm run android:build` genera `build/athlete-core-staging.apk` con los valores de `.env.staging.local`. Va firmado con la clave de pruebas del ordenador que lo genera (la de Android Studio), no con una de tienda. La app nunca apunta a Supabase local: el móvil no llega a él.
  - **Registrar entrenos en el navegador** (`VITE_ALLOW_WEB_WORKOUTS`) se ignora en **cualquier** `vite build`, no solo en el de producción: así no hace falta acordarse de quitarla y no llega a ninguna web publicada. En la app instalada da igual, porque allí siempre se puede (D-116).
  - **Botón "atrás":** vuelve a la pantalla anterior; en la primera, la app pasa a segundo plano en vez de cerrarse (como las demás apps de Android), y no se pierde nada.
  - **Barra de estado:** transparente sobre la app (Android 15 lo exige), con una franja del color de la cabecera debajo para que nada quede tapado. La hora y los iconos cambian a claro u oscuro con el modo de la marca del coach.
  - **Icono provisional:** el mismo dibujo que el favicon, sobre el azul de la plataforma. El definitivo, con las tiendas (Fase 4).
- **Por qué:** el propietario no es programador: un comando y un archivo que se instala como cualquier otro. Las zonas seguras y el botón "atrás" se resuelven en `core/native` y en las carcasas, sin código por plataforma.
- **Revisar si:** se publica en Google Play (Fase 4): entonces hace falta la clave de firma de tienda, que nunca va en Git.

### D-138 · Cómo se guardan los entrenos en la base de datos
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.2 que D-118, D-119 y D-124 no fijaban.
  - **Tres tablas, solo de lectura desde la app:** `workouts`, `workout_exercises` y `workout_sets`. Se escriben con `sync_workout` (el cliente sube el entreno entero) y `discard_workout`. Los identificadores los crea el móvil.
  - **Gana lo más reciente, por fila:** cada ejercicio lleva `changed_at` y cada serie `recorded_at`, que pone el móvil. Al subir, una fila solo se pisa si lo que llega es más nuevo. Por eso subir dos veces lo mismo no cambia nada.
  - **Una serie es su número y su lado** dentro del ejercicio, no su identificador: si dos móviles apuntan la serie 2, queda una fila con el último cambio.
  - **Nada se borra al subir.** Desmarcar una serie la deja con `is_done = false`, para que también ese cambio gane o pierda por la hora. Las series sin hacer no cuentan.
  - **Un entreno cerrado sigue cerrado**, aunque llegue tarde algo del móvil que lo tenía abierto. Si al subir cambia algo de uno cerrado, queda `edited_at` ("Editado"); pasados 7 días desde que se cerró, se rechaza (`workout_locked`). La primera subida de un entreno sí se acepta siempre, aunque el móvil haya estado una semana sin cobertura.
  - **El móvil que lo tiene abierto** gana por `device_since` (cuándo lo tomó: al empezar o con "Seguir aquí"), no por la hora del último dato: así lo que suba con retraso el primer móvil no le quita el entreno al segundo.
  - **Si el coach cambia la rutina**, el entreno no se pierde: si falta el bloque, el día o el ejercicio de la rutina, se guarda sin ese enlace y con su copia de lo prescrito y su número de día. La rutina sí tiene que ser del cliente.
  - **Descartar** solo vale para un entreno abierto; uno cerrado ya es historial. Descartar algo que no está en la nube no hace nada, para que el móvil pueda repetirlo.
  - **Varios entrenos abiertos a la vez** no los impide la base de datos: lo impide la app (D-119). Si dos móviles sin conexión empezaran dos distintos, rechazar uno sería perder datos.
  - **Las horas del móvil** se aceptan con un día de margen sobre la del servidor, como el "hoy" de D-105.
  - **La forma de medir de un ejercicio** tampoco cambia si tiene series apuntadas, aunque ya no esté en ninguna rutina (amplía D-072).
- **Por qué:** lo más importante de la fase es no perder nada (D-118). Con "gana lo más reciente" y sin borrar, el orden en que lleguen las subidas da igual.
- **Revisar si:** los relojes de los móviles dan problemas al comparar horas.

### D-139 · Cómo se guardan la regla del día saltado y los días faltados
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.2b que D-125 no fijaba.
  - **La regla se guarda con su historia:** `program_missed_day_rules` tiene una fila por cada cambio, con el día desde el que vale (el "hoy" del coach, D-105). Sin filas, la regla es "se pierde". Si la cambia dos veces el mismo día, vale la última.
  - **Los días faltados** (`program_missed_days`) guardan la rutina, el día de la rutina (con su bloque y su número, por si el coach lo quita después) y la fecha. Una fecha solo se apunta una vez, y queda aunque luego se haga ese día.
  - **Los apunta la app del cliente** con `record_missed_days`: solo días de entreno de su rutina, desde que empezó y antes de su "hoy". La base de datos no comprueba que esa fecha tocara ese día: lo calcula la app con el calendario (`programs/model/calendar.ts`).
  - **Solo con calendario.** En modo lista no hay fechas que faltar, así que ni la regla ni los días faltados valen (`invalid_mode`). Una rutina terminada no cambia de regla.
  - **En `audit_log`** queda `program.missed_day_rule_changed`, solo con identificadores y la regla.
- **Por qué:** con una sola columna, cambiar de "se mueve todo" a "se pierde" borraría el retraso acumulado, y D-125 dice que el cambio no recalcula el pasado.

### D-140 · Cómo se guardan el consentimiento, el peso y las medidas
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.3a que D-126 y D-127 no fijaban.
  - **Consentimiento:** `health_consents`, una fila por cliente y negocio con cuándo se dio, la versión del texto (`2026-11-draft`…) y cuándo se retiró. Darlo otra vez reutiliza la fila. Solo se escribe con `grant_health_consent` y `withdraw_health_consent`, y solo lo hace el propio cliente mientras siga de alta. El coach lo lee.
  - **Retirarlo** borra en la misma operación el peso, las medidas y el texto de las notas del día de ese espacio (el entreno y sus series se quedan).
  - **Peso** (`body_weights`): uno por día, en kg, entre 20 y 400. **Medidas** (`body_measurements`): una por día, medida y lado, en cm; brazo, muslo y gemelo llevan lado y las demás no. El cliente los escribe directamente (RLS), sin función.
  - **Lo comprueba la base de datos:** el RLS no deja escribir peso ni medidas sin consentimiento, y un trigger en `workout_exercises` rechaza una nota del día nueva (`health_consent_required`), porque `sync_workout` se salta el RLS.
  - **El coach** lee peso y medidas solo mientras el consentimiento siga dado, y no los escribe.
  - **En `audit_log`**: `health_consent.granted` (con la versión) y `health_consent.withdrawn`, solo con identificadores.
- **Por qué:** escribir peso y medidas no tiene reglas de negocio más allá del consentimiento, que el RLS ya cubre; una función por cada cosa sería código de más.

### D-141 · Cómo se guardan el set-up, los ajustes de entreno y el interruptor de logros
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.3b que D-120, D-122, D-123 y D-130 no fijaban.
  - **Set-up** (`client_exercise_setups`): uno por cliente y ejercicio del negocio, de 1 a 500 caracteres. El cliente lo escribe directamente (RLS) mientras siga de alta; el coach lo lee y no lo escribe.
  - **Ajustes de entreno**, columnas de `profiles` (de la persona, valen en todos sus espacios): `default_rest_seconds` (120 de partida, de 0 a 3600 como el descanso de la rutina), `rest_autostart`, `rest_sound` y `rest_vibration` (activados) y `same_button`: `previous` (por defecto, "Igual" copia la vez anterior) o `previous_then_today` (la serie 1 copia la vez anterior y las siguientes, la serie anterior de hoy). Los cambia cada uno en el suyo; el coach los ve.
  - **Interruptor de logros:** la clave `achievementsEnabled` de `tenants.settings`. Sin la clave, activados. La base de datos solo admite un sí o un no, y lo cambia el dueño. `achievements_enabled(tenant)` lo lee con el valor por defecto. Leerlo en la app (`parseTenantSettings`, en `core/tenancy`) llega con la pantalla de Ajustes.
- **Por qué:** como el peso (D-140), no hay reglas de negocio más allá de quién escribe, que el RLS ya cubre.

### D-142 · Reparto Claude/Gemini
- **Fecha:** 2026-11-17
- **Sustituida en parte por D-144:** Gemini ya decide en sus PR, puede tocar `supabase/` y `src/core/` y escribe sus propias D-xxx. Lo que sigue vigente de aquí es quién hace cada PR y la revisión cruzada.
- **Decisión:** ajusta D-115. Desde el PR 3.3, la Fase 3 la hacen dos agentes con papeles distintos:
  - **Claude decide:** es el único que escribe en `docs/DECISIONES.md`. Hace la base de datos (`supabase/`), la seguridad, `src/core/` y los PR 3.3 a 3.9. **Revisa cada PR de Gemini** (plantilla §4 de `docs/PROMPTS.md`) antes de que el propietario lo fusione.
  - **Gemini revisa cada PR de Claude** con la misma plantilla, antes de fusionarlo.
  - **Gemini programa** los PR 3.10 a 3.18. No toca `supabase/` ni `src/core/` y no decide: si algo no está decidido o no encaja, lo apunta en el apartado "Dudas para Claude" del PR y sigue con lo demás.
  - **Quién hace cada PR** está en la columna "Quién" de `docs/PROMPTS.md` §7, junto con lo que se puede hacer en paralelo.
  - **Lo que uno deba saber del otro se escribe en el repositorio** (el PR, `CONTEXTO.md`, `docs/ESTADO.md`, `docs/GUIA-GIT.md`), no en la memoria de un chat.
- **Por qué:** decisión del propietario, para avanzar en paralelo sin que dos agentes decidan cosas distintas sobre lo mismo. Lo delicado (aislamiento de datos, migraciones, `core/`) queda en un solo agente.
- **Consecuencias:** AGENTS.md §7 lo resume (aprobado por el propietario). La plantilla de PR gana "Dudas para Claude" y "Lo que tiene que saber el siguiente".
- **Revisar si:** los PR de Gemini necesitan muchas correcciones.

### D-143 · Cómo se guarda en el móvil y cómo sube lo pendiente
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.4 que D-118 no fijaba. El PR se parte en dos: **3.4a** (los cimientos, en `core/` y `app/`) y **3.4b** (el módulo `workouts`: descargar lo necesario para entrenar y subir los entrenos).
  - **Lo ya cargado se guarda en el teléfono**, no solo lo de entrenar: con la app quitada de la multitarea o el móvil apagado, sin red no se podrían cargar ni los espacios, ni los flags, ni la marca, y la app se quedaría en "Cargando". En la app instalada, la caché de TanStack Query se guarda en el almacén del teléfono y se recupera antes de pintar (lo cargado hace más de 30 días se descarta). Al cerrar sesión se guarda vacía. **En el navegador no se guarda** (todo sigue igual). Aprobado por el propietario.
  - **Abrir sin conexión con la sesión iniciada:** el token de Supabase dura una hora. Si ha caducado y no hay red para renovarlo, Supabase arranca sin sesión pero la deja guardada (solo la borra si el servidor la rechaza). Mientras siga guardada, la app entra con ella. No da acceso a nada: sin un token válido la base de datos no responde, y al volver la conexión Supabase la renueva o la cierra.
  - **La cola de subida vive en `core/native`**, una por usuario, en el almacén del teléfono. Es genérica: cada módulo encola lo suyo con un tipo (`workout`…) y pone quién lo sube. Así cerrar sesión puede preguntar sin depender de ningún módulo.
  - **En orden y sin duplicar:** se sube de uno en uno; si algo falla por la red, se para (lo de detrás espera) y se reintenta a los 5 s, 10 s, 20 s… hasta 5 minutos, y además al volver la conexión o a la app. Encolar otra vez lo mismo sustituye la versión anterior en su sitio. Si cambia mientras se sube, la versión nueva no se borra: se sube también.
  - **Rechazos:** si la base de datos lo rechaza, reintentar no sirve. "Ya no tienes acceso" (`not_allowed`, el coach lo dio de baja) y cualquier otra regla o dato no válido (incluida una clave repetida, que antes habría atascado la cola) quedan marcados como rechazados, se avisa al cliente y la cola sigue con lo demás. El registro lleva solo el nombre de la regla. El aviso se olvida cuando el cliente lo lee.
  - **Cerrar sesión con algo pendiente** pregunta antes ("Tienes entrenos sin subir. Si cierras sesión, se perderán"); al cerrar, la cola de ese usuario se vacía. Si la sesión caduca, la cola se queda y se sube al volver a entrar con la misma cuenta.
  - **Arranque de la subida:** el manifest de un módulo gana un campo opcional, `services`: componentes sin pantalla que `app/` monta con la sesión iniciada, en cualquier pantalla y cualquier espacio. Cada uno puede decir con `enabled` dónde está activo; si no lo está, ni se carga su código (el de `workouts`, solo donde `canLogWorkouts()`). Hace falta porque un cliente dado de baja ya no puede entrar en ese espacio, y su cola tiene que intentarlo igual para poder avisarle (PR 3.4b). Aprobado por el propietario (toca `core/modules`).
- **Por qué:** el criterio del PR 3.4 es abrir la app sin red, tras cerrarla del todo, y ver la rutina y el día de hoy. Con solo la rutina guardada no se llegaba a esa pantalla.
- **Revisar si:** lo guardado en el teléfono crece mucho (la caché de un coach con muchos clientes): entonces se guarda solo lo que se elija.

### D-144 · Gemini decide en sus PR y reglas para chats en paralelo
- **Fecha:** 2026-11-17
- **Decisión:** sustituye la parte de D-142 que limitaba a Gemini (no decidir, no tocar `supabase/` ni `src/core/`, solo Claude escribe en este archivo). El resto de D-142 sigue: quién hace cada PR (columna "Quién" de `docs/PROMPTS.md` §7) y la revisión cruzada.
  1. **Gemini decide lo de sus PR con criterio propio:** pantallas, nombres, estructura y cómo resolver un caso no previsto. No se para a preguntar lo que puede razonar; pregunta solo lo irreversible (regla de oro 13).
  2. **Puede tocar cualquier carpeta** (`src/core/` y `supabase/` incluidas), escribir migraciones y añadir librerías. Esta decisión es el permiso expreso que piden las reglas de oro 9 y 10 para sus PR; cada librería nueva se anota igualmente en D-135 (o en una D-xxx) con su porqué.
  3. **Antes de decidir lee este archivo.** Si su idea contradice una decisión existente, no la cambia: la propone en el PR con el porqué y sigue lo decidido mientras tanto.
  4. **Todo lo que decide lo deja escrito** aquí como D-xxx con "(Gemini)" en el título y su porqué, igual que Claude. Lo que el siguiente deba saber, en `docs/ESTADO.md` y `CONTEXTO.md`. En el PR, el apartado "Decisiones tomadas y dudas" (antes "Dudas para Claude").
  5. **Siguen todas las reglas de oro.** Claude revisa antes de fusionar todo PR que toque `supabase/`, RLS o permisos. La revisión cruzada (PROMPTS §0) sigue para todos los PR.
  6. **Si algo sale mal, se arregla en otro PR.** Equivocarse no es motivo para dejar de decidir.
  - **Chats en paralelo** (`docs/GUIA-GIT.md` §15): cada chat en su worktree y su rama; nunca en paralelo dos PR que creen o cambien la misma carpeta de módulo o los mismos archivos; la base local es una sola (`db:reset`, `db:test` y e2e, nunca dos chats a la vez); al empezar, `gh pr list` y `git worktree list`; tras cada fusión, las ramas abiertas integran `main` con un merge; quien fusiona avisa de las ramas que quedan detrás. PROMPTS §7 dice qué carpetas toca cada PR y si usa la base local.
- **Por qué:** decisión del propietario. Con Gemini parado a preguntar, el paralelo no avanzaba; y el 2026-11-17 tres PR crearon a la vez `src/modules/workouts` y dos chats chocaron en la base local.
- **Revisar si:** las decisiones de Gemini chocan a menudo con las existentes o sus PR de `supabase/` necesitan muchas correcciones.

### D-145 · Gráficas del progreso, sin librería (Gemini)
- **Fecha:** 2026-11-17
- **Decisión:** detalles del PR 3.16 que D-127, D-129 y D-135 no fijaban:
  - **Componente `LineChart` en `src/core/ui`:** SVG puro sin librerías externas (D-135), reutilizable y responsive (`viewBox`). Puntos con área táctil amplia (40 px) para pantallas táctiles de móvil, interacción con toque, arrastre o cursor mostrando tooltip con valor y fecha, línea indicadora vertical y accesibilidad por teclado (`role="button"`, `aria-label`).
  - **Métricas por ejercicio:** 4 métricas seleccionables (RM estimado, peso máximo, volumen total y repeticiones totales).
  - **Periodos temporales:** 4 semanas (`4w`), 3 meses (`3m`) y Todo (`all`). Al filtrar, las estadísticas y la gráfica se recalculan de inmediato.
  - **% de progreso por RM:** compara el RM estimado del primer entreno del periodo con el del último (D-129). Si se cambia de "4 semanas" a "Todo", cambia para reflejar la evolución desde el principio o en el último mes.
  - **Detalle del entreno seleccionado:** debajo de la gráfica se muestran el día, fecha, series en formato textual y nota del día del punto seleccionado o del último entreno.
  - **Peso corporal y medidas corporales:** pestaña dedicada dentro de Progreso ("Peso y medidas"), con gráfica de línea de la métrica elegida (peso, cintura, cadera, brazo, etc.), estadísticas de cambio en el periodo y último valor. Respeta el consentimiento de salud (D-126): si no se ha concedido, no se muestra ningún dato.
- **Por qué:** permite visualizar la sobrecarga progresiva y la evolución corporal de un vistazo, sin dependencias pesadas y con los colores de marca de cada coach.

---


## Pendientes de decidir

| Nº | Qué | Cuándo hay que decidirlo |
|---|---|---|
| P-01 | **Cerrado el 2026-11-14.** El dominio es `athlete-core.com`, gestionado en Cloudflare. Los emails salen de `no-reply@athlete-core.com` (D-046) | — |
| P-02 | Nicho definitivo tras hablar con coaches. **Provisional desde el 2026-11-15** (D-070): coach de gimnasio, musculación y fuerza. El propietario hablará con 3–5 coaches cuando tenga la demo; las preguntas están en D-070 | Al terminar la Fase 3 y, en todo caso, antes de empezar la Fase 4 |
| P-03 | Hosting de la web: Vercel o Cloudflare Pages. Comprobar en ambos el coste con dos personas subiendo código y las condiciones de uso comercial | Antes de enseñar la app a coaches |
| P-04 | **Cerrado el 2026-11-15** por D-071: un catálogo de 120 ejercicios de la plataforma y una copia para cada negocio, que el coach edita como suya | — |
| P-05 | Pagos: proveedor para la suscripción del coach, cobros del coach a sus clientes y dónde se contrata (web o app, según las normas de las tiendas) | Fase 5 |
| P-06 | **Cerrado el 2026-11-16** por D-118: los entrenos se registran sin conexión en la app del móvil desde la Fase 3. El resto de la app sigue D-061 | — |
| P-07 | Notificaciones push | Fase 4 |
| P-08 | Servicio para compilar iOS en la nube | Fase 4 |
| P-09 | **Cerrado el 2026-11-14.** Cómo se entra: D-035, D-038 (se verifica el email), D-039 (código por email) y D-053 (sin lista pública de coaches) | — |
| P-10 | Servicio de avisos de errores y de caídas | Fase 4 |
| P-11 | **Cerrado el 2026-11-14** por D-063: plan gratuito de Supabase. Se revisa antes del primer usuario real | — |
| P-12 | **Cerrado en parte el 2026-11-16** por D-126: consentimiento único por espacio para peso, medidas y notas. **Sigue abierto:** el texto definitivo y la edad de los menores por país, con un abogado | Fase 4, con los textos legales |

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
| `@capacitor/android` | 8.6 | La app de Android (PR 3.1, D-117) |
| `@capacitor/app` | 8.1 | El botón "atrás" de Android (PR 3.1, D-135) y saber cuándo se vuelve a la app (PR 3.4) |
| `@capacitor/preferences` | 8.0 | El almacén del teléfono, que el sistema no borra (PR 3.4, D-118 y D-135) |

**Compilación y estilos**

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `typescript` | 6.0 | Lenguaje (D-022) |
| `vite` | 8.3 | Servidor de desarrollo y compilación |
| `@vitejs/plugin-react` | 6.3 | React dentro de Vite |
| `tailwindcss`, `@tailwindcss/vite` | 4.3 | Estilos |
| `@capacitor/cli` | 8.6 | Herramienta de Capacitor (`npx cap sync`; Android desde el PR 3.1) |
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

- CI: `actions/checkout@v7` y `actions/setup-node@v7`. Desde el PR 3.1b, `actions/upload-artifact@v7` (el informe de los tests de flujos completos si fallan) y el Chromium que trae `@playwright/test`.
- Identificador de la app móvil en `capacitor.config.ts`: `app.athletecore.mobile`. Es **provisional**: hay que fijar el definitivo antes de publicar en las tiendas (Fase 4), porque después no se puede cambiar.

**La app de Android** (PR 3.1, 2026-11-16). Las genera `npx cap add android`; se actualizan con Capacitor, nunca a mano.

| Qué | Versión | Notas |
|---|---|---|
| Android Studio | La estable más reciente | Solo hace falta para el Java y las herramientas de Android (`android/README.md`) |
| Gradle | 8.14 | `android/gradle/wrapper/gradle-wrapper.properties` |
| Android Gradle Plugin | 8.13 | `android/build.gradle` |
| SDK de Android | compila con el 36, funciona desde el 24 (Android 7) | `android/variables.gradle` |
