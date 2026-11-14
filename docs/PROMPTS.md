# PROMPTS

Plantillas para pedir trabajo a los agentes de IA. Copia, rellena los huecos entre corchetes y pega.

El prompt de la Fase 0 está en `EMPEZAR-AQUI.md`.

---

## 0. Empezar y cerrar un chat

**Regla:** un chat nuevo por cada tarea (= una rama = un PR). En el mismo chat solo se sigue mientras se trabaja en esa misma tarea, por ejemplo para corregir lo que salió en la revisión.

### Al abrir un chat nuevo

Pega esto y, debajo, la tarea (con la plantilla §1, §2 o §3):

```
Chat nuevo. Antes de nada lee CONTEXTO.md y AGENTS.md, y los documentos
que indica AGENTS.md §2 si la tarea los necesita. Resúmeme en 3 líneas en
qué punto está el proyecto y luego empieza con esta tarea:

[pega aquí la tarea]
```

Si aún no tienes la tarea clara, pega solo las 3 primeras líneas y pregúntale qué toca según `docs/ESTADO.md`.

### Antes de cerrar un chat

```
Antes de cerrar este chat comprueba que:
1. CONTEXTO.md y docs/ESTADO.md reflejan lo que hemos hecho (fase,
   última tarea, siguiente tarea y últimos cambios).
2. git status está limpio y todo está subido.
Si falta algo, hazlo en esta misma rama con un commit. Después dime en
3 líneas qué queda pendiente para el próximo chat.
```

### Revisión cruzada

Si una tarea la ha hecho Claude, pide a Gemini que revise el PR con la plantilla §4 (o al revés), cada uno en su chat. Nunca dos agentes escribiendo a la vez en la misma rama.

---

## 1. Plantilla para cualquier tarea

```
Lee AGENTS.md y docs/ESTADO.md antes de empezar. Sigue docs/GUIA-GIT.md.

TAREA: [qué hay que conseguir, en una o dos frases]
MÓDULO: [carpeta de src/modules/ afectada, o "core" si aplica]
RAMA: [tipo/descripcion-corta]

QUÉ DEBE PASAR AL TERMINAR (criterios de aceptación):
1. [Como coach, puedo …]
2. [Como cliente, veo …]
3. [Caso límite: si no hay datos, se muestra …]

FUERA DE ALCANCE (no lo hagas):
- [lo que no quiero que toque]

Si te falta algo importante para empezar, pregúntamelo todo junto ahora.
Si no, trabaja de forma autónoma hasta terminar, con commits pequeños.
Termina como indica AGENTS.md §8: npm run check en verde, docs/ESTADO.md
actualizado, git status limpio, PR abierto y un resumen con cómo probarlo.
```

Consejos:

- Una tarea = un PR de unas 300 líneas como máximo. Si es más grande, divídela antes de pedirla.
- Los criterios de aceptación son lo más importante del prompt. Escríbelos como cosas que se puedan comprobar mirando la app.
- Toda tarea debe salir de algo que haya pedido un coach o de una fase de `docs/ESTADO.md`.

---

## 2. Arreglar un fallo

```
Lee AGENTS.md. Sigue docs/GUIA-GIT.md.

FALLO: [qué pasa]
CÓMO REPRODUCIRLO: [pasos exactos, con qué perfil y en qué pantalla]
QUÉ DEBERÍA PASAR: [comportamiento correcto]
RAMA: fix/[descripcion-corta]

Primero escribe un test que falle por culpa de este fallo. Después arréglalo
con el cambio más pequeño posible. No toques nada que no tenga que ver.
Explícame la causa en dos frases.
```

---

## 3. Crear un módulo nuevo

```
Lee AGENTS.md, docs/ARQUITECTURA.md (§5, §6, §8 y §15) y docs/ESTADO.md.

TAREA: crear el módulo [nombre] — [qué función aporta].
RAMA: feat/modulo-[nombre]

Antes de programar, entrégame un diseño corto y espera mi OK:
1. Pantallas del coach y pantallas del cliente (lista con una línea cada una).
2. Tablas nuevas, con sus columnas y quién puede leer y escribir cada una.
3. De qué otros módulos depende (ARQUITECTURA §6).
4. En cuántos PR lo dividirías y en qué orden.

Después del OK, sigue ARQUITECTURA §15, empezando por el primer PR.
```

---

## 4. Revisar un Pull Request

Sirve para revisar el trabajo del colaborador o de otro agente antes de aprobarlo.

```
Revisa el Pull Request [número o enlace] contra AGENTS.md y docs/ARQUITECTURA.md.
No cambies código: solo revisa.

Dime, por orden de gravedad:
1. Seguridad: tablas sin tenant_id, sin RLS o sin test de aislamiento; secretos;
   uso de la clave service_role; permisos que solo se comprueban en la pantalla.
2. Reglas rotas: fronteras entre módulos, textos sin i18n, código para un
   cliente concreto, dependencias nuevas sin anotar, trampas con tests o lint.
3. Fallos probables: casos límite, estados de carga, vacío y error.
4. Cosas que sobran: cambios que no pedía la tarea.

Para cada punto: archivo, línea, por qué es un problema y cómo arreglarlo.
Acaba con un veredicto: "listo para fusionar", "cambios pequeños" o "rehacer".
```

---

## 5. Fase 1 — Cuentas, negocio del coach y unirse con código

Es una fase grande: va en varios PR. Pídelos de uno en uno.

Antes de empezar cada PR: abre **Docker Desktop** y déjalo abierto, porque Supabase local lo necesita.

### PR 1.1 — Base de datos

```
Lee AGENTS.md, docs/ARQUITECTURA.md §8 y §9, docs/GUIA-GIT.md §9 y
docs/referencia/ (los tres archivos).

TAREA: poner en marcha la base de datos del proyecto.
RAMA: db/esquema-base

1. Configura Supabase local y los comandos db:start, db:stop, db:reset,
   db:test y db:types de ARQUITECTURA §13.
2. Convierte docs/referencia/esquema-base.sql en la primera migración.
   Valora activar el bloque OPCIONAL de privilegios por defecto y demuestra
   con un test que una tabla nueva sin "grant" no es accesible.
3. Convierte los casos de docs/referencia/pruebas-aislamiento.sql en tests
   pgTAP dentro de supabase/tests/. Deben pasar todos.
   No incluyas las tablas de ejemplo de plantilla-tabla-negocio.sql.
4. Crea supabase/seed.sql con datos inventados: 2 coaches y 5 clientes.
5. Genera los tipos en src/core/supabase/database.types.ts.
6. Añade al CI: base de datos local, migraciones, tests y la comprobación
   de que ninguna tabla pública está sin RLS.

El catálogo de flags (tabla features) empieza vacío: el flag de cada
módulo se añade cuando se crea ese módulo (ARQUITECTURA §15).
No crees pantallas en este PR.
```

### Los PR de la Fase 1, del 1.2 al 1.17

El diseño está decidido en `docs/DECISIONES.md` (D-036 a D-064; D-065 a D-067 lo ajustan al implementarlo). Se piden **en este orden y de uno en uno**: cada PR sale de `main` con el anterior ya fusionado o, si el anterior aún no se ha fusionado, de su rama, con el PR apilado encima (D-064).

| PR | Qué hace | Rama |
|---|---|---|
| 1.2 | Base de datos: cuentas y emails | `db/cuentas-y-emails` |
| 1.3 | Sesión y login con contraseña | `feat/sesion-y-login` |
| 1.4 | Tenant y rol reales, y guardas de ruta | `feat/tenancy-real` |
| 1.5 | Flags reales | `feat/flags-reales` |
| 1.6 | Recuperar la contraseña y entrar con un código por email | `feat/recuperar-y-codigo` |
| 1.7 | Registro y verificación del email | `feat/registro` |
| 1.8 | Base de datos: invitaciones, bajas y negocio | `db/invitaciones-y-bajas` |
| 1.9 | Primera pantalla y unirse con código | `feat/unirse-con-codigo` |
| 1.10 | Módulo `clients`: lista y código de invitación | `feat/modulo-clients` |
| 1.11 | Dar de baja y reactivar a un cliente | `feat/baja-de-clientes` |
| 1.12 | Crear negocio y primeros pasos del coach | `feat/crear-negocio` |
| 1.13 | Perfil y cuenta | `feat/perfil` |
| 1.14 | Selector de espacio y "Mis espacios" | `feat/selector-de-espacio` |
| 1.15 | Marca: nombre, colores y modo | `feat/marca-del-coach` |
| 1.16 | Marca: logo | `feat/logo-del-coach` |
| 1.17 | Staging y emails reales | `chore/staging` |

Cómo pedir uno: abre con la cabecera de §0 y pega debajo el bloque del PR. Todos los bloques dan por hecho esto:

- Se termina como indica AGENTS.md §8. Cada PR ronda las 300 líneas; si se pasa, el agente lo dice antes de seguir y propone cómo partirlo.
- Los PR que tocan `supabase/`, `src/core/` o la configuración de la raíz lo hacen porque la tarea lo pide: se indica en el apartado "Zonas protegidas" del PR.
- Textos en inglés y en español, y las pantallas probadas en ancho de móvil y de escritorio.
- Todo formulario cumple D-061: sin conexión, error inesperado y botón desactivado mientras envía.

Para comprobar los criterios en tu ordenador:

- `npm run db:start`, `npm run db:reset` y `npm run dev`.
- Usuarios inventados, todos con la contraseña `password123`: `coach.iron@example.com` (Iron Lab, código `IRONLAB1`), `coach.norte@example.com` (Norte Strength, código `NORTE001`), y los clientes `ana@`, `bruno@`, `carla@` (Iron Lab), `diego@` y `elena@example.com` (Norte Strength).
- Los emails no salen de tu ordenador: se ven en `http://127.0.0.1:54324`. La base de datos se ve en `http://127.0.0.1:54323` (Studio).

### PR 1.2 — Base de datos: cuentas y emails

```
TAREA: preparar la base de datos y la configuración de cuentas para
entrar, registrarse y recibir los emails con código.
RAMA: db/cuentas-y-emails
DECISIONES: D-038 a D-046, D-052, D-058 y D-060.

INCLUYE:
1. supabase/config.toml: confirmar el email es obligatorio; contraseña
   de 8 caracteres como mínimo; código de 6 dígitos que caduca a los
   15 minutos; 60 segundos entre un envío y el siguiente; pedir la
   contraseña actual para cambiarla (salvo si se entró con un código);
   aviso por email al cambiar la contraseña; la dirección de la app
   local bien puesta. NO se activa el cierre de sesión por inactividad
   de Supabase: lo hace la app en el PR 1.3 (D-045 y D-063).
2. Las 4 plantillas de email en supabase/templates/, cada una en inglés
   y en español según el idioma guardado en los datos de la cuenta
   (user_metadata.locale, D-044). Solo llevan el código: ningún
   enlace. Textos, más abajo. Si el asunto no puede cambiar según el
   idioma, se usa el asunto bilingüe de D-044.
3. Una migración nueva (la primera no se edita):
   - Al crearse un usuario, su perfil toma de los datos del registro el
     nombre, el idioma, la unidad de peso, la fecha y la versión de los
     términos aceptados (columnas nuevas en profiles para estas dos).
   - Una función, que se puede llamar sin sesión, que dice si un email
     no tiene cuenta, la tiene sin confirmar o la tiene confirmada.
     Lleva el tope de D-052 (20 comprobaciones en 10 minutos por
     dirección IP). No devuelve ningún otro dato.
4. Tests pgTAP de lo anterior, incluido el tope.
5. Tipos regenerados.

NO INCLUYE: pantallas; cambios en invitaciones y miembros (PR 1.8);
envío real de emails (PR 1.17).

TEXTOS DE LOS EMAILS (el asunto empieza por el código):
- Confirmar la cuenta. Asunto: "{código} es tu código de ATHLETE CORE".
  Cuerpo: "Hola, {nombre}: tu código para confirmar tu email es
  {código}. Caduca en 15 minutos. Si no has creado una cuenta en
  ATHLETE CORE, ignora este email."
- Código para entrar. Mismo asunto. Cuerpo: "Tu código para entrar es
  {código}. Caduca en 15 minutos. Si no lo has pedido, ignora este
  email: nadie puede entrar sin él."
- Cambiar la contraseña. Mismo asunto. Cuerpo: "Tu código para cambiar
  la contraseña es {código}. Caduca en 15 minutos. Si no lo has pedido,
  ignora este email: tu contraseña no cambia."
- Aviso. Asunto: "Tu contraseña de ATHLETE CORE se ha cambiado".
  Cuerpo: "La contraseña de tu cuenta se acaba de cambiar. Si no has
  sido tú, abre la app, pulsa 'He olvidado mi contraseña' y pon una
  nueva."
En inglés, la traducción directa de cada uno.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. En Studio, la tabla profiles muestra los 7 usuarios del seed con su
   nombre, igual que antes.
3. La descripción del PR trae una captura de cada uno de los 4 emails,
   en español y en inglés, tomada de la bandeja local. Ninguno lleva
   enlaces y todos dicen ATHLETE CORE.
4. La app arranca y se ve igual que antes de este PR.
```

### PR 1.3 — Sesión y login con contraseña

```
TAREA: que se pueda entrar con email y contraseña, y cerrar sesión.
RAMA: feat/sesion-y-login
DECISIONES: D-025, D-041, D-043, D-045 y D-061.

INCLUYE:
1. Las dos variables de Supabase pasan a ser obligatorias y el cliente
   queda tipado con los tipos generados (D-025).
2. core/auth: la sesión (se mantiene al recargar y al cerrar la app),
   entrar con contraseña y cerrar sesión.
3. Pantalla /login: email, contraseña con botón de mostrar y "Entrar".
4. Mensajes de D-043 al entrar: "No hay ninguna cuenta con este email",
   "La contraseña no es correcta", cuenta sin confirmar y "Demasiados
   intentos". Aquí solo el mensaje: los botones resaltados llegan con
   sus pantallas (PR 1.6 y 1.7).
5. Guarda mínima: sin sesión, /coach y /client llevan a /login; con
   sesión, /login lleva al inicio. Después de entrar se vuelve a la
   pantalla que se había pedido.
6. Un botón provisional "Cerrar sesión" en la cabecera de las dos
   zonas (pasa al perfil en el PR 1.13).
7. Sesión caducada: aviso y vuelta a /login (D-061).
8. Los 30 días sin uso de D-045: la app guarda en el dispositivo la
   última vez que se abrió y, si han pasado más de 30 días, cierra la
   sesión al arrancar. Con test unitario.
9. Test de extremo a extremo: entrar y cerrar sesión con un usuario
   del seed.
10. La franja fija "Sin conexión" de D-061, en todas las pantallas.

NO INCLUYE: registro, verificación ni recuperar contraseña; el tenant
real (después de entrar, la app sigue enseñando el coach de ejemplo de
la Fase 0: lo arregla el PR 1.4); la primera pantalla /start.

CRITERIOS DE ACEPTACIÓN:
1. Sin sesión, abrir /coach o /client lleva a /login.
2. Con ana@example.com y password123 entro. Si recargo la página,
   sigo dentro.
3. Con una contraseña mala veo "La contraseña no es correcta". Con un
   email inventado veo "No hay ninguna cuenta con este email". En los
   dos casos sigo en la misma pantalla y no se borra el email.
4. "Cerrar sesión" me devuelve a /login, y /client ya no se abre.
5. Con la base de datos parada (npm run db:stop), "Entrar" muestra
   "No hay conexión. Inténtalo de nuevo".
6. La pantalla se ve bien en inglés y en español, y en un móvil.
7. El PR explica en "Cómo probarlo" qué test demuestra que, pasados
   31 días sin abrir la app, hay que volver a entrar.
```

### PR 1.4 — Tenant y rol reales, y guardas de ruta

```
TAREA: que la app use el coach, el rol y la marca reales del usuario
que ha entrado, en lugar de los datos de ejemplo de la Fase 0.
RAMA: feat/tenancy-real
DECISIONES: D-030, D-048, D-056 y D-061.

INCLUYE:
1. core/tenancy lee de la base de datos los espacios del usuario
   (negocio, rol, estado y marca). Quien usa useTenancy() no cambia.
2. Se borran sample-tenancy.ts, sus tests y el selector de perfil de
   la barra de desarrollo.
3. La marca del espacio activo se aplica al tema.
4. "/" reparte según la tabla de D-056. Con varios espacios, por ahora
   se entra en el de coach si existe y, si no, en el más antiguo (el
   selector llega en el PR 1.14). Sin ningún espacio, /welcome.
5. Guardas de D-056 para /coach y /client.
6. /welcome se queda como está, con un botón "Cerrar sesión".
7. Tests unitarios de la lógica "adónde va cada uno".

NO INCLUYE: flags reales (PR 1.5); selector (PR 1.14); unirse con
código (PR 1.9); crear negocio (PR 1.12).

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com entra en /coach y ve Iron Lab en rojo y con
   fondo oscuro.
2. coach.norte@example.com entra en /coach y ve Norte Strength en
   verde azulado y con fondo claro.
3. ana@example.com entra en /client con la marca de Iron Lab. Si
   escribe /coach en la barra de direcciones, vuelve a /client.
4. diego@example.com entra en /client con la marca de Norte Strength.
5. Ya no aparece el selector de perfil de desarrollo.
```

### PR 1.5 — Flags reales

```
TAREA: que las funciones activas de cada coach salgan de la base de
datos en lugar de los datos de ejemplo.
RAMA: feat/flags-reales
DECISIONES: D-019 y D-030.

INCLUYE:
1. core/flags lee la vista tenant_effective_features del espacio
   activo. Quien usa useFeature() y <FeatureGate> no cambia.
2. Se borra sample-flags.ts.
3. El módulo de ejemplo (_template) sigue viéndose solo en desarrollo,
   sin necesitar un flag en la base de datos.
4. Tests: un flag apagado desmonta las rutas y el menú de su módulo.

NO INCLUYE: flags nuevos (el de clients llega en el PR 1.10); que el
coach apague funciones desde sus ajustes.

CRITERIOS DE ACEPTACIÓN:
1. Entrando como coach y como cliente, la app se ve igual que antes
   de este PR.
2. npm run check termina en verde y el PR explica en "Cómo probarlo"
   qué test demuestra que un flag apagado esconde su módulo.
```

### PR 1.6 — Recuperar la contraseña y entrar con un código por email

```
TAREA: que quien ya tiene cuenta pueda recuperar su contraseña y
entrar sin ella, con un código de 6 dígitos que llega por email.
RAMA: feat/recuperar-y-codigo
DECISIONES: D-039, D-042, D-043, D-044, D-052 y D-061.

INCLUYE:
1. Un campo para el código de 6 dígitos: admite pegar el código entero
   y abre el teclado numérico en el móvil.
2. /reset-password: email, código y contraseña nueva. Al guardarla, el
   usuario queda dentro y la app cierra sus sesiones en los demás
   dispositivos.
3. "Entrar con un código por email", desde /login: email, código y
   dentro.
4. En /login: los enlaces a las dos cosas. El mensaje de contraseña
   equivocada resalta el botón "He olvidado mi contraseña".
5. Email sin cuenta: el mensaje de D-043, y no se envía ningún email
   (el botón "Crear cuenta" llega en el PR 1.7).
6. "Enviar otro código" se activa a los 60 segundos, con cuenta atrás.
   Código equivocado o caducado, y "Demasiados intentos".

NO INCLUYE: registro (PR 1.7); cambiar la contraseña desde el perfil
(PR 1.13).

CRITERIOS DE ACEPTACIÓN:
1. En /login pulso "He olvidado mi contraseña" y escribo
   ana@example.com. En la bandeja local aparece un email en español
   con un código y sin enlaces. Lo escribo, pongo una contraseña nueva
   y quedo dentro. La contraseña antigua ya no sirve.
2. Llega además el email "Tu contraseña de ATHLETE CORE se ha
   cambiado".
3. Con bruno@example.com el email llega en inglés.
4. "Entrar con un código por email" con carla@example.com: escribo el
   código y entro sin contraseña.
5. Con un código inventado veo "El código no es correcto o ha
   caducado". "Enviar otro código" no se puede pulsar hasta que pasan
   60 segundos.
6. Con un email inventado veo "No hay ninguna cuenta con este email" y
   en la bandeja no aparece nada.
```

### PR 1.7 — Registro y verificación del email

```
TAREA: que cualquiera pueda crear su cuenta y confirmarla con el
código que le llega por email.
RAMA: feat/registro
DECISIONES: D-038, D-040, D-041, D-043, D-044, D-058 y D-060.

INCLUYE:
1. /signup: nombre, email, contraseña con botón de mostrar, la casilla
   de D-060 y "Crear cuenta". Se guardan el idioma de la app, la
   unidad de peso y la fecha y versión de los términos.
2. /verify: el código de 6 dígitos, con "Enviar otro código".
3. Los avisos de D-043 al registrarse, con su botón resaltado: cuenta
   que ya existe y cuenta pendiente de confirmar.
   Seguridad: nada más confirmar el código, la app vuelve a guardar la
   contraseña recién escrita, para que valga siempre la última. Si ya
   no la tiene (se cerró la app entre medias), pide elegir una
   contraseña antes de seguir (D-043).
4. En /login: el enlace "Crear cuenta", que además se resalta con el
   mensaje "No hay ninguna cuenta con este email". Quien entra con una
   cuenta sin confirmar ve "Esta cuenta está pendiente de confirmar"
   con "Confirmar mi email" resaltado, que manda un código nuevo y
   lleva a /verify (la pantalla no cambia sola, D-043).
5. Las páginas /legal/terms y /legal/privacy con un texto de borrador,
   marcado como "Borrador".
6. Test de extremo a extremo: registrarse, leer el código de la
   bandeja local y confirmar.

NO INCLUYE: unirse con código (PR 1.9); crear negocio (PR 1.12); la
primera pantalla /start (PR 1.9). Después de confirmar se llega a
/welcome, que todavía es la pantalla de la Fase 0.

CRITERIOS DE ACEPTACIÓN:
1. Desde /login, "Crear cuenta". Sin marcar la casilla no me deja
   seguir. Con una contraseña de 7 caracteres me pide 8.
2. Con datos correctos llega un email, en el idioma en que tengo la
   app, con un código. Lo escribo y entro: veo /welcome.
3. Si me registro con ana@example.com veo "Ya existe una cuenta con
   este email", con "He olvidado mi contraseña" resaltado. La pantalla
   no cambia sola.
4. Empiezo un registro y cierro la app antes de escribir el código.
   Vuelvo a registrarme con el mismo email y otra contraseña: veo
   "Esta cuenta está pendiente de confirmar". La confirmo, cierro
   sesión y solo puedo entrar con la segunda contraseña.
5. En Studio, la fila de profiles del usuario nuevo tiene su nombre,
   su idioma y la fecha en que aceptó los términos.
6. /legal/terms y /legal/privacy se abren y dicen "Borrador".
```

### PR 1.8 — Base de datos: invitaciones, bajas y negocio

```
TAREA: adaptar las funciones de la base de datos a las reglas
decididas para el código, unirse y dar de baja.
RAMA: db/invitaciones-y-bajas
DECISIONES: D-050 a D-052, D-054, D-055 y D-060.

INCLUYE (en una migración nueva):
1. El generador de códigos de D-050: 8 caracteres sin 0, O, 1, I, L.
2. La vista previa (preview_invite) se puede llamar sin sesión y
   devuelve solo el nombre y la marca.
3. El tope de intentos de D-052 en la vista previa y en unirse.
4. join_tenant_with_code con un error distinto para cada caso de
   D-054. Ya no reactiva a un cliente dado de baja.
5. Dos funciones nuevas, solo para el dueño: dar de baja y reactivar
   a un cliente. Reactivar comprueba el límite del plan. Las dos se
   anotan en audit_log. Se retira el permiso de cambiar directamente
   la columna status de tenant_members.
6. Una función que devuelve los espacios del usuario. De los que está
   dado de baja devuelve solo el nombre del coach (para D-055).
7. create_tenant anota en audit_log la versión de las condiciones
   para coaches aceptadas (D-060).
8. Tests pgTAP de cada caso.
9. Seed: Norte Strength pasa al plan starter; la coach de Iron Lab es
   además clienta de Norte Strength; se añade fran@example.com, dado
   de baja en Norte Strength. Iron Lab queda con el plan lleno.
10. Tipos regenerados.

NO INCLUYE: pantallas; Storage para logos (PR 1.16); el flag de
clients (PR 1.10).

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. La descripción del PR lista qué test cubre cada caso de D-054 y de
   D-055.
3. En Studio, tenant_members muestra: Iron Lab con 3 clientes activos;
   Norte Strength con 3 activos (uno es la coach de Iron Lab) y uno
   archivado (Fran).
4. La app sigue funcionando: entran ana@example.com (cliente) y
   coach.iron@example.com (coach).
```

### PR 1.9 — Primera pantalla y unirse con código

```
TAREA: la primera pantalla de la app y el camino completo del cliente:
escribir el código, ver a su coach, crear la cuenta y quedar dentro.
RAMA: feat/unirse-con-codigo
DECISIONES: D-037, D-050 a D-052, D-054, D-056 y D-057.

INCLUYE:
1. /start, la primera pantalla de D-037: idioma arriba; el campo
   "Código de tu coach" y "Continuar" en primer plano; debajo, "¿Ya
   tienes cuenta? Entrar" y "¿Eres coach? Crea tu negocio". Sin
   sesión, "/" lleva aquí.
2. /join?code=…: la vista previa del coach (D-051), con sesión y sin
   ella, pintada con la marca del coach. Sin logo todavía: iniciales.
3. El código se recuerda en el dispositivo (7 días como máximo).
   Después de registrarse y confirmar, o de entrar, el alta se hace
   sola y se llega a /client. Mientras hay un código recordado,
   /signup, /verify y /login se ven con la marca de ese coach.
4. Todos los casos de D-054, cada uno con su mensaje, y el tope de
   D-052.
5. /welcome (con sesión y sin ningún espacio): campo de código,
   "Crear mi negocio" y "Cerrar sesión".
6. El código se escribe como indica D-050: sin importar mayúsculas,
   espacios ni guiones.
7. Test de extremo a extremo: abrir el enlace sin cuenta, registrarse,
   confirmar y quedar dentro como cliente.

NO INCLUYE: crear negocio (PR 1.12): hasta entonces, "Crea tu negocio"
y "Crear mi negocio" llevan a una pantalla que dice "Disponible
pronto". La pantalla "Ya no tienes acceso" (PR 1.11). Añadir un coach
desde el perfil (PR 1.14). Que el enlace abra la app instalada
(Fase 4).

SI PASA DE 300 LÍNEAS, se parte así:
- 1.9a: /start, la vista previa de /join, unirse con sesión, todos los
  mensajes de D-054, el tope de intentos y /welcome. Criterios 1, 2, 4
  a 10, entrando primero con una cuenta ya creada.
- 1.9b: recordar el código mientras se crea la cuenta, la marca del
  coach en /signup, /verify y /login, el alta automática al terminar y
  el test de extremo a extremo. Criterio 3.

CRITERIOS DE ACEPTACIÓN:
1. Sin sesión, al abrir la app veo la primera pantalla: idioma arriba,
   el campo del código y los dos enlaces debajo.
2. Escribo "norte001" en minúsculas y veo "Vas a entrenar con Norte
   Strength" con sus colores, y los botones "Crear cuenta" y "Ya tengo
   cuenta".
3. Creo una cuenta desde ahí: el registro y la confirmación se ven con
   los colores de Norte Strength y, al confirmar, entro en /client sin
   volver a escribir el código.
4. Abrir /join?code=NORTE001 sin sesión enseña la misma vista previa.
5. Con el código ABCD2345 veo "Este código no existe o ya no es
   válido. Pide a tu coach el código actual".
6. Una cuenta nueva con IRONLAB1 ve "Tu coach no tiene plazas libres
   ahora mismo. Avísale para que te haga hueco".
7. fran@example.com con NORTE001 ve "Tu coach te ha dado de baja.
   Pídele que te reactive".
8. ana@example.com abre /join?code=IRONLAB1 y entra directa a /client.
9. coach.norte@example.com con NORTE001 ve "Este es el código de tu
   propio negocio".
10. Tras 10 códigos equivocados seguidos veo "Demasiados intentos.
    Vuelve a probar en unos minutos".
```

### PR 1.10 — Módulo `clients`: lista y código de invitación

```
TAREA: que el coach vea quién ha entrado con su código, y pueda ver,
compartir y regenerar ese código.
RAMA: feat/modulo-clients
DECISIONES: D-050, D-051 y D-059.

INCLUYE:
1. El módulo clients (npm run new:module clients) y la migración que
   añade su flag, de tipo core.
2. /coach/clients, la lista de D-059: pestañas "Activos" y "Dados de
   baja", buscador por nombre, orden alfabético, etiqueta "Nuevo"
   durante 7 días, contador de plazas y aviso de plan lleno.
3. La tarjeta del código: verlo en dos grupos de cuatro, copiarlo,
   compartir el enlace y regenerarlo con confirmación (solo el dueño).
4. Lista vacía: "Aún no tienes clientes. Comparte tu código".
5. Los 4 estados de la pantalla: cargando, vacío, error y con datos.
6. La lista de miembros la da core/tenancy (ARQUITECTURA §6).
7. Una variable de entorno nueva y opcional con la dirección pública
   de la web, para montar el enlace. Si falta, se usa la dirección
   desde la que se está viendo la app.

NO INCLUYE: la ficha del cliente, dar de baja y reactivar (PR 1.11);
el email del cliente; el alta de un segundo coach (staff).

SI PASA DE 300 LÍNEAS, se parte así:
- 1.10a: el módulo, su flag y la lista (puntos 1, 2, 4, 5 y 6).
  Criterios 1, 2, 3, 6 y 7.
- 1.10b: la tarjeta del código y la variable de la dirección pública
  (puntos 3 y 7). Criterios 4 y 5.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com ve "Clientes" en el menú. Dentro: Ana, Bruno
   y Carla por orden alfabético, "3 de 3 plazas" y el aviso de que ha
   llegado al límite.
2. coach.norte@example.com ve 3 clientes activos y "3 de 10 plazas".
   En "Dados de baja" aparece Fran.
3. Si busco "die" solo queda Diego.
4. La tarjeta muestra el código "NORT E001". "Copiar" lo copia.
   "Compartir" abre el menú de compartir del dispositivo, o copia el
   enlace acabado en /join?code=NORTE001.
5. "Regenerar" pide confirmación. Al aceptar aparece un código nuevo
   de 8 caracteres, sin 0, O, 1, I ni L. NORTE001 deja de funcionar en
   /join, y Diego sigue entrando como siempre.
6. Un cliente que se acaba de unir (PR 1.9) aparece con la etiqueta
   "Nuevo".
7. ana@example.com no ve "Clientes" en su menú, y /coach/clients la
   devuelve a /client.
```

### PR 1.11 — Dar de baja y reactivar a un cliente

```
TAREA: que el coach pueda dar de baja a un cliente y reactivarlo, y
que el cliente dado de baja vea la app bloqueada.
RAMA: feat/baja-de-clientes
DECISIONES: D-055, D-056, D-059 y D-061.

INCLUYE:
1. La ficha del cliente, /coach/clients/:id: nombre, fecha de alta y
   el botón "Dar de baja" o "Reactivar".
2. Dar de baja pide confirmación y explica el efecto: "Dejará de ver
   tu contenido y liberará una plaza. Sus datos se guardan y puedes
   reactivarlo cuando quieras".
3. Reactivar. Con el plan lleno: "No tienes plazas libres. Da de baja
   a otro cliente o cambia de plan".
4. Para el cliente dado de baja de su único coach, /welcome muestra
   "Ya no tienes acceso a [nombre del coach]", con la marca de
   ATHLETE CORE y las tres salidas de D-055.
5. Si le dan de baja con la app abierta, al volver a la app llega a
   esa pantalla (D-061).

NO INCLUYE: borrar los datos del cliente; avisarle por email; que el
propio cliente deje a su coach (Fase 4); las pestañas de rutinas y
progreso de la ficha (Fases 2 y 3).

CRITERIOS DE ACEPTACIÓN:
1. coach.norte@example.com abre la ficha de Diego y pulsa "Dar de
   baja". Tras confirmar, Diego pasa a "Dados de baja" y el contador
   baja a "2 de 10 plazas".
2. diego@example.com entra y ve "Ya no tienes acceso a Norte
   Strength", con los colores de ATHLETE CORE. Si escribe NORTE001 ve
   "Tu coach te ha dado de baja. Pídele que te reactive".
3. coach.norte@example.com reactiva a Diego, y Diego vuelve a entrar
   en /client como antes.
4. coach.iron@example.com (plan lleno) da de baja a Carla: "2 de 3
   plazas". Una cuenta nueva ya puede unirse con IRONLAB1. Después,
   al reactivar a Carla ve "No tienes plazas libres…".
5. Con Diego dentro en otra ventana, la coach lo da de baja. Cuando
   Diego vuelve a su ventana ve la pantalla de "Ya no tienes acceso".
```

### PR 1.12 — Crear negocio y primeros pasos del coach

```
TAREA: que un coach pueda crear su negocio y sepa qué hacer después.
RAMA: feat/crear-negocio
DECISIONES: D-037, D-048, D-049 y D-060.

INCLUYE:
1. "¿Eres coach? Crea tu negocio" en /start lleva al registro. La
   intención se recuerda en el dispositivo y, al confirmar la cuenta,
   se llega a la pantalla de crear negocio.
2. La pantalla de crear negocio: el nombre (de 2 a 40 caracteres) y la
   casilla "Acepto las condiciones para coaches", con enlace a
   /legal/coach-terms (texto de borrador).
3. Al crearlo se llega a /coach. La marca inicial es el nombre del
   negocio con los colores de ATHLETE CORE y el modo oscuro.
4. La tarjeta de primeros pasos de D-049 en el inicio del coach.
5. "Crear mi negocio" en /welcome lleva a la misma pantalla. Quien ya
   es dueño de un negocio no ve esa opción.

NO INCLUYE: editar la marca (PR 1.15); planes de pago (Fase 5); el
alta de un segundo coach (staff).

CRITERIOS DE ACEPTACIÓN:
1. Desde /start pulso "¿Eres coach? Crea tu negocio", me registro y,
   al confirmar el email, veo la pantalla de crear negocio.
2. Con un nombre de una letra, o sin marcar la casilla, no me deja
   seguir.
3. Con "Fuerza Sur" llego a /coach: veo el nombre Fuerza Sur, los
   colores de ATHLETE CORE y la tarjeta de primeros pasos con sus dos
   enlaces.
4. En Clientes veo "0 de 3 plazas", la lista vacía y un código de 8
   caracteres.
5. Otra cuenta nueva se une con ese código. La tarjeta de primeros
   pasos deja de verse.
6. coach.norte@example.com no ve "Crear mi negocio" en ningún sitio.
```

### PR 1.13 — Perfil y cuenta

```
TAREA: que cada usuario pueda ver y cambiar sus datos y cerrar sesión.
RAMA: feat/perfil
DECISIONES: D-042, D-045, D-057 y D-058.

INCLUYE:
1. /client/profile para el cliente, y el apartado "Mi cuenta" de
   /coach/settings para el coach, con lo mismo: nombre, idioma, unidad
   de peso, el email (solo se muestra), cambiar la contraseña,
   enlaces a los textos legales y cerrar sesión.
2. Cambiar el idioma cambia la app al momento y se guarda en el
   perfil y en los datos de la cuenta (user_metadata.locale), para que
   los emails lleguen en el idioma nuevo (D-044). Al entrar en otro
   dispositivo, la app toma el idioma del perfil.
3. Cambiar la contraseña pide la actual, salvo a quien entró con un
   código por email (D-042). Después la app cierra las sesiones de los
   demás dispositivos.
4. El botón provisional de cerrar sesión de la cabecera desaparece.
5. En el perfil del cliente, pequeño: "Con tecnología de ATHLETE
   CORE".

NO INCLUYE: foto de perfil; cambiar el email; borrar la cuenta
(Fase 4); "Mis espacios" (PR 1.14); la marca (PR 1.15).

CRITERIOS DE ACEPTACIÓN:
1. ana@example.com cambia su nombre en Perfil. coach.iron@example.com
   ve el nombre nuevo en su lista de clientes.
2. Ana pone el idioma en español: la app cambia al momento. Cierra
   sesión, vuelve a entrar (también desde otro navegador) y sigue en
   español. Si pide un código por email, llega en español. (En el
   seed, Ana tiene la cuenta en inglés desde el PR 1.13.)
3. Ana cambia la unidad a lb y, al recargar, sigue en lb.
4. Al cambiar la contraseña con la actual equivocada ve "La contraseña
   no es correcta". Con la correcta se cambia y llega el email de
   aviso.
5. El email se ve, pero no se puede editar.
6. coach.norte@example.com tiene las mismas opciones en Ajustes, "Mi
   cuenta".
7. "Cerrar sesión" está aquí y ya no en la cabecera.
```

### PR 1.14 — Selector de espacio y "Mis espacios"

```
TAREA: que quien pertenece a más de un negocio elija con cuál entrar,
y que cualquiera pueda añadir un coach o crear su negocio después.
RAMA: feat/selector-de-espacio
DECISIONES: D-048 y D-056.

INCLUYE:
1. /select: la lista de espacios, cada uno con su logo o sus
   iniciales, su nombre y la etiqueta "Coach" o "Cliente".
2. Se recuerda en el dispositivo el último espacio usado, y se entra
   directamente en él.
3. El apartado "Mis espacios" en el perfil y en los ajustes: la lista,
   cambiar de espacio, "Añadir un coach con código" y, para quien no
   tiene negocio, "Crear mi negocio".

NO INCLUYE: dejar un espacio por decisión propia (Fase 4).

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com (dueña de Iron Lab y clienta de Norte
   Strength) entra por primera vez y ve el selector con dos filas:
   Iron Lab "Coach" y Norte Strength "Cliente".
2. Elige Norte Strength y entra en /client con esa marca. Cierra la
   app, la abre y entra directa en Norte Strength.
3. En "Mis espacios" cambia a Iron Lab y llega a /coach con la marca
   de Iron Lab.
4. elena@example.com (un solo espacio) no ve nunca el selector. Desde
   "Mis espacios" crea su negocio: ahora es coach y clienta a la vez,
   y la próxima vez que entra ve el selector.
5. Una cuenta que es clienta de un coach añade otro con "Añadir un
   coach con código" y pasa a tener dos espacios.
```

### PR 1.15 — Marca: nombre, colores y modo

```
TAREA: que el coach personalice el nombre, los colores y el modo que
ven sus clientes.
RAMA: feat/marca-del-coach
DECISIONES: D-028 y D-057.

INCLUYE:
1. El apartado "Marca" de /coach/settings, solo para el dueño: nombre
   del negocio, color principal y de acento (paleta de 12 colores o
   uno propio), modo claro u oscuro, vista previa, "Volver a los
   colores de ATHLETE CORE" y "Guardar".
2. Guardar el nombre actualiza el nombre del negocio y el de la marca.

NO INCLUYE: el logo (PR 1.16).

CRITERIOS DE ACEPTACIÓN:
1. coach.norte@example.com cambia el color principal: la vista previa
   cambia antes de guardar. Al guardar cambia toda su app.
2. diego@example.com abre la app y ve el color nuevo. La vista previa
   de /join con el código de ese coach también lo enseña.
3. Con un color muy claro (un amarillo) los botones y los textos se
   siguen leyendo bien.
4. Al cambiar el nombre a "Norte Barbell" cambia en la cabecera, en
   la lista de espacios y en la vista previa del código.
5. Cambiar entre claro y oscuro cambia el fondo de la app.
6. "Volver a los colores de ATHLETE CORE" recupera los originales.
7. Un nombre de una letra no se puede guardar.
```

### PR 1.16 — Marca: logo

```
TAREA: que el coach suba su logo y se vea en toda la app.
RAMA: feat/logo-del-coach
DECISIONES: D-051 y D-057.

INCLUYE:
1. Una migración con el espacio de Storage para logos: ruta que
   empieza por el tenant_id; solo el dueño sube, cambia y borra;
   cualquiera puede leer. Con su test de aislamiento.
2. En "Marca": subir, cambiar y quitar el logo. Se admiten PNG, JPG y
   WebP de 2 MB como máximo.
3. El logo se ve en la cabecera, en el selector, en "Mis espacios", en
   la vista previa del código y en el registro con marca. Sin logo,
   las iniciales sobre el color principal.

NO INCLUYE: recortar o editar la imagen dentro de la app.

CRITERIOS DE ACEPTACIÓN:
1. coach.norte@example.com sube un PNG de menos de 2 MB: se ve en la
   vista previa y, al guardar, en la cabecera.
2. diego@example.com lo ve en su app. Abrir /join?code=… sin sesión
   también lo enseña.
3. Con una imagen de 3 MB ve "El logo no puede pasar de 2 MB". Con un
   SVG o un PDF ve "Formato no admitido. Usa PNG, JPG o WebP".
4. "Quitar logo" vuelve a enseñar las iniciales.
5. npm run db:test demuestra que una coach no puede cambiar el logo
   de otro negocio.
```

### PR 1.17 — Staging y emails reales

```
TAREA: poner en marcha el entorno de pruebas en la nube (staging) y
el envío real de emails.
RAMA: chore/staging
DECISIONES: D-013, D-046, D-060 y D-063. Pendiente P-01.

ANTES DE PEDIRLO, el propietario tiene que tener:
- El dominio comprado (P-01).
- Una cuenta de Supabase (plan gratuito, D-063) y otra de Resend.

INCLUYE:
1. Una guía paso a paso en supabase/README.md, y el agente acompaña al
   propietario mientras la sigue: crear el proyecto de staging en una
   región de la Unión Europea; aplicar las migraciones; dejar las
   cuentas configuradas igual que en local (confirmación, contraseña,
   códigos y plantillas); conectar Resend por SMTP; verificar el
   dominio; subir el tope de emails por hora de Supabase a 100; cargar
   los datos inventados.
2. Comprobar las consecuencias del plan gratuito de D-063 (proyectos,
   pausa y copias de seguridad) y corregir D-063 si algo ha cambiado.
   Explicar en la guía cómo reanudar staging si se pausa.
3. Las variables de staging, documentadas en .env.example sin valores.
4. docs/ESTADO.md: la Fase 1 queda terminada.

NO INCLUYE: producción (solo el propietario, AGENTS.md regla 12);
publicar la web (P-03); las apps de móvil (Fase 4).

CRITERIOS DE ACEPTACIÓN:
1. Con la app de mi ordenador apuntando a staging, me registro con mi
   email de verdad y el código me llega en menos de un minuto.
2. El remitente es "ATHLETE CORE" con una dirección de mi dominio, y
   el email no cae en spam en Gmail ni en Outlook.
3. Los emails llegan en español o en inglés según el idioma de la app.
4. Recuperar la contraseña funciona de principio a fin.
5. En el repositorio no hay ninguna clave ni contraseña.
```

---

## 6. Fase 2 — Ejercicios y rutinas

El diseño está decidido en `docs/DECISIONES.md` (D-069 a D-088). Son **18 PR en 5 lotes**. Se piden **en este orden y de uno en uno**, cada uno en su chat.

| Lote | PR | Qué hace | Rama |
|---|---|---|---|
| 1. Ejercicios | 2.1 | Base de datos: ejercicios | `db/ejercicios` |
| | 2.2 | Los 120 ejercicios de la plataforma | `db/biblioteca-de-ejercicios` |
| | 2.3 | Ejercicios: lista, buscador y filtros | `feat/modulo-exercises` |
| | 2.4 | Crear, editar, archivar y recuperar ejercicios | `feat/editar-ejercicios` |
| 2. Plantilla | 2.5 | Base de datos: rutinas | `db/rutinas` |
| | 2.6 | Base de datos: guardar una rutina de una vez | `db/guardar-rutina` |
| | 2.7 | Rutinas: lista de plantillas | `feat/modulo-programs` |
| | 2.8 | Editor: los días del ciclo | `feat/editor-dias` |
| 3. Rellenar | 2.9 | Editor: los ejercicios de cada día | `feat/editor-ejercicios` |
| | 2.10 | Editor: series y prescripción | `feat/editor-series` |
| | 2.11 | Copiar y duplicar | `feat/copiar-y-duplicar` |
| 4. Asignar | 2.12 | Base de datos: asignar | `db/asignar-rutinas` |
| | 2.13 | Asignar a clientes y pestaña "Asignadas" | `feat/asignar-rutinas` |
| | 2.14 | Ficha del cliente: pestaña "Rutina" | `feat/rutina-en-la-ficha` |
| | 2.15 | El cliente ve su rutina | `feat/rutina-del-cliente` |
| 5. Bloques y remates | 2.16 | Varios bloques | `feat/bloques` |
| | 2.17 | Superseries | `feat/superseries` |
| | 2.18 | Inicio: avisos del coach y "Hoy toca" del cliente | `feat/inicio-con-rutinas` |

### Cómo se trabaja por lotes (D-069)

- **Un lote no empieza hasta que el anterior está fusionado en `main`** con el visto bueno del propietario (D-068). Dentro de un lote, un PR puede salir de la rama del anterior, apilado (D-064).
- **Al terminar un lote**, el agente le dice al propietario qué probar en la app (la línea "Al terminar el lote" de abajo) y espera su "adelante" para fusionar.
- **Unas 300 líneas de verdad por PR.** Cuentan el código, el SQL y los tests. No cuentan `database.types.ts` ni los datos (la lista de ejercicios y el seed). Si a mitad se ve que va a pasar de 400, el agente para, lo dice y lo parte como indica su bloque ("SI PASA DE 300 LÍNEAS").

| Lote | Al terminar el lote, el propietario puede… |
|---|---|
| 1 | Entrar como coach, ver los 120 ejercicios, buscarlos, crear los suyos y archivarlos |
| 2 | Crear una plantilla, poner los días del ciclo con sus descansos y guardarla |
| 3 | Montar entera su rutina real, con ejercicios y series, y copiarla |
| 4 | Asignarla a Ana y verla entrando como Ana |
| 5 | Hacer una rutina que cambia cada semana o cada mes, y ver los avisos en el inicio |

### Lo que dan por hecho todos los bloques

- Se abre con la cabecera de §0 y, debajo, el bloque del PR. Se termina como indica AGENTS.md §8.
- **Nada de la Fase 3:** ni "Iniciar entreno", ni apuntar series, ni gráficas (D-088).
- **Los PR de base de datos** llevan, en la misma migración, `tenant_id`, permisos (`grant`) explícitos, RLS con políticas y su test de aislamiento en `supabase/tests/` (AGENTS.md §5 y `docs/referencia/plantilla-tabla-negocio.sql`). Cada bloque dice qué casos 15 a 19 y 28 de `docs/referencia/pruebas-aislamiento.sql` cubre; la descripción del PR dice qué test cubre cada uno. Terminan con los tipos regenerados (`npm run db:types`).
- **Zonas protegidas:** los PR que tocan `supabase/` o `src/core/` lo hacen porque la tarea lo pide. Cada bloque dice cuáles; se repite en el apartado "Zonas protegidas" del PR.
- Textos en inglés y en español. Pantallas probadas en ancho de móvil y de escritorio, **con las mismas funciones en los dos** (D-085). Toda pantalla con datos trata sus 4 estados: cargando, vacío, error y con datos.
- Todo formulario cumple D-061: sin conexión, error inesperado y botón desactivado mientras envía.
- Los nombres de tablas y funciones que aparecen en los bloques son orientativos. Lo que hace cada una, no.

Para comprobar los criterios en tu ordenador:

- Abre **Docker Desktop**. Después, `npm run db:start`, `npm run db:reset` y `npm run dev`.
- Usuarios inventados, todos con la contraseña `password123`: `coach.iron@example.com` (Iron Lab: Ana, Bruno y Carla) y `coach.norte@example.com` (Norte Strength: Diego y Elena; Fran está dado de baja). Los clientes entran con `ana@example.com`, `bruno@example.com`, etc.
- **Las cuentas del seed están en inglés**, salvo la de Carla. Para ver la app en español: Ajustes (coach) o Perfil (cliente) → Idioma. Por eso los ejercicios de la plataforma salen en los criterios con su nombre en inglés ("Lat pulldown") y los que escribió el coach, en español ("Remo Gironda agarre amplio").
- **Cada lista de criterios parte del seed recién cargado** (`npm run db:reset`). "Prueba" es una plantilla semanal que creas tú con "Nueva plantilla" cuando un criterio la nombra y no la tienes.
- La base de datos se ve en `http://127.0.0.1:54323` (Studio).

---

### PR 2.1 — Base de datos: ejercicios

```
TAREA: crear las tablas de ejercicios: el catálogo de la plataforma y
los ejercicios de cada negocio.
RAMA: db/ejercicios
DECISIONES: D-071, D-072, D-073 y D-086.
ZONAS PROTEGIDAS: supabase/.

ANTES DE EMPEZAR: comprueba que docs/ARQUITECTURA.md §8 ya recoge la
excepción del catálogo de ejercicios. Si todavía dice "Pendiente de
decidir: una biblioteca global de ejercicios", para y pregunta: ese
cambio lo aprueba el propietario.

INCLUYE (en una migración nueva):
1. El catálogo de la plataforma: una tabla SIN tenant_id, de solo
   lectura para cualquier usuario con sesión, como plans o features.
   Guarda, de cada ejercicio: una clave fija en inglés, el nombre en
   inglés y en español, el grupo muscular, el material, la forma de
   medir y si es unilateral. En este PR queda vacío.
2. Los ejercicios del negocio: tabla de negocio según la plantilla
   (tenant_id, unique (tenant_id, id), índices por tenant_id,
   updated_at con su trigger). Guarda: nombre (1 a 80 caracteres;
   vacío mientras valga el del catálogo), de qué ejercicio del
   catálogo viene (opcional), forma de medir, unilateral, grupo,
   material, instrucciones (hasta 2.000), enlace de vídeo (solo
   https://), cuándo se archivó y quién lo creó.
3. Las listas cerradas de D-072: 4 formas de medir, 14 grupos y 8
   materiales. Un valor fuera de la lista se rechaza.
4. Permisos y RLS: el coach (owner y staff) lee, crea y edita los
   ejercicios de su negocio. NADIE los borra: no hay permiso de
   borrado (D-073). El cliente todavía no lee nada (llega en el PR 2.5).
5. Al crearse un negocio recibe una copia de cada ejercicio del
   catálogo. No se toca create_tenant: se hace con un trigger propio.
6. El tope de D-086: 1.000 ejercicios sin archivar por negocio.
7. El flag "exercises", de tipo core. Si un flag sin módulo rompe
   algún test, se deja para el PR 2.3 y se dice en el resumen.
8. Tests pgTAP:
   - Caso 15: un coach no puede crear ni editar ejercicios en el
     negocio de otro, ni los ve.
   - Caso 18 (la mitad): un cliente no puede crear ejercicios.
   - Caso 28: updated_at cambia solo al editar.
   - Sin sesión no se lee nada. Nadie puede borrar. El catálogo se
     lee pero no se escribe. Un negocio nuevo recibe la copia (con
     una fila de catálogo puesta en el propio test). El tope.

NO INCLUYE: los 120 ejercicios (PR 2.2); las tablas de rutinas ni la
regla de "no cambiar la forma de medir de un ejercicio usado" (PR
2.5); ninguna pantalla.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. En Studio existen las dos tablas, vacías y con el candado de RLS.
3. La descripción del PR dice qué test cubre los casos 15 y 28 y cada
   regla de la lista.
4. La app arranca y se ve igual que antes de este PR.
```

### PR 2.2 — Los 120 ejercicios de la plataforma

```
TAREA: cargar en el catálogo los 120 ejercicios de la plataforma y
repartirlos a los negocios que ya existen.
RAMA: db/biblioteca-de-ejercicios
DECISIONES: D-071 y D-072.
ZONAS PROTEGIDAS: supabase/.

INCLUYE (en una migración nueva):
1. Las 120 filas de docs/referencia/biblioteca-ejercicios.md, tal
   cual: clave, nombre en español y en inglés, grupo, material,
   forma de medir y unilateral. Este PR no decide nada: si algo de la
   lista parece un error, se pregunta al propietario.
2. La copia para los negocios que ya existen (staging). Repetirla no
   duplica nada.
3. Tests pgTAP: el catálogo tiene 120 filas con claves únicas; un
   negocio nuevo recibe 120 ejercicios; ejecutar la copia dos veces
   deja 120.

NO INCLUYE: instrucciones ni vídeos (D-074); pantallas.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. En Studio, el catálogo tiene 120 filas, y la tabla de ejercicios,
   240: 120 de Iron Lab y 120 de Norte Strength.
3. Creo un negocio nuevo desde la app ("¿Eres coach?") y en Studio
   ese negocio tiene sus 120 ejercicios.
4. Abro tres filas al azar del catálogo y coinciden con el documento.
```

### PR 2.3 — Ejercicios: lista, buscador y filtros

```
TAREA: que el coach vea sus ejercicios y los encuentre rápido.
RAMA: feat/modulo-exercises
DECISIONES: D-071, D-072, D-073 y D-085.

INCLUYE:
1. El módulo exercises (npm run new:module exercises), en el
   registro, con su README. En el menú del coach: "Ejercicios"
   (orden 30, después de Rutinas).
2. /coach/exercises: la lista por orden alfabético. Cada fila: el
   nombre, el grupo muscular, el material, la etiqueta "Unilateral" y
   la etiqueta "Propio" en los que creó el coach.
3. El nombre de un ejercicio del catálogo que el coach no ha cambiado
   se ve en el idioma del usuario (D-071).
4. Buscador por nombre, sin importar tildes ni mayúsculas. La
   búsqueda se hace en la app, sobre la lista ya cargada.
5. Filtros: grupo muscular, material y origen ("Todos", "Míos", "De
   la plataforma"). Se combinan entre sí y con el buscador.
6. Pestañas "Activos" y "Archivados", con el número de cada una.
7. Los 4 estados. Vacío por búsqueda: "Ningún ejercicio coincide".
8. Lógica de búsqueda y filtros en model/, con tests unitarios.

NO INCLUYE: crear, editar, archivar ni recuperar (PR 2.4). La
pestaña "Archivados" existe pero estará vacía.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com ve "Ejercicios" en el menú. Dentro, 120
   ejercicios por orden alfabético, en inglés.
2. Cambio la app a español y los mismos ejercicios se ven en español.
3. En español, busco "jalon" (sin tilde) y quedan 3: "Jalón al
   pecho", "Jalón con agarre estrecho" y "Jalón con agarre neutro".
4. Filtro por "Pecho" y "Máquina" y quedan 4.
5. Busco "zzzz" y veo "Ningún ejercicio coincide".
6. Con la base de datos parada (npm run db:stop) veo un mensaje de
   error con "Reintentar".
7. ana@example.com no ve "Ejercicios" en su menú, y /coach/exercises
   la devuelve a /client.
8. En un móvil la lista y los filtros se usan igual que en el
   ordenador.
```

### PR 2.4 — Crear, editar, archivar y recuperar ejercicios

```
TAREA: que el coach cree sus ejercicios y cambie, archive y recupere
cualquiera de su lista.
RAMA: feat/editar-ejercicios
DECISIONES: D-071 a D-074.

INCLUYE:
1. "Nuevo ejercicio": nombre y forma de medir (obligatorios);
   unilateral, grupo, material, instrucciones y enlace de vídeo
   (opcionales). Validado con Zod.
2. Editar cualquier ejercicio de la lista, venga o no del catálogo.
3. "Restaurar original", solo en los que vienen del catálogo y han
   cambiado: vuelven al nombre y los datos del catálogo.
4. "Archivar" y, en la pestaña "Archivados", "Recuperar". Nunca se
   borra (D-073).
5. "Duplicar": crea una copia propia y abre su formulario.
6. El enlace de vídeo solo admite https://. Se abre fuera de la app
   (D-074).
7. Con una búsqueda sin resultados: "Crear «lo escrito»", que abre el
   formulario con ese nombre ya puesto.
8. En móvil el formulario ocupa la pantalla; en escritorio, un panel.

NO INCLUYE: la regla de no cambiar la forma de medir de un ejercicio
que ya está en una rutina (llega con las rutinas, PR 2.5 y 2.9);
subir vídeos; instrucciones de serie para el catálogo.

SI PASA DE 300 LÍNEAS, se parte así:
- 2.4a: crear y editar (puntos 1, 2, 6, 7 y 8). Criterios 1 a 4 y 8.
- 2.4b: archivar, recuperar, duplicar y restaurar (puntos 3, 4 y 5).
  Criterios 5 a 7.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com crea "Flexiones con mochila", medido en
   "Peso corporal y repeticiones". Aparece en la lista con la
   etiqueta "Propio".
2. Busco "sentadilla lateral", no existe, pulso "Crear «sentadilla
   lateral»" y el formulario se abre con ese nombre.
3. Cambio el nombre de "Lat pulldown" a "Jalón agarre amplio". Tras
   recargar sigue así, en inglés y en español.
4. Un enlace de vídeo que no empieza por https:// no se guarda y el
   formulario dice por qué.
5. "Restaurar original" en ese ejercicio lo devuelve a "Lat pulldown".
6. Archivo "Burpee": desaparece de "Activos" y aparece en
   "Archivados". "Recuperar" lo devuelve.
7. Duplico "Push-up": aparece una copia con la etiqueta "Propio".
8. coach.norte@example.com no ve "Flexiones con mochila" ni ningún
   cambio de Iron Lab.
```

### PR 2.5 — Base de datos: rutinas

```
TAREA: crear las tablas de las rutinas, con sus permisos y sus tests
de aislamiento. Son las primeras tablas de negocio con datos de
clientes: aquí se escriben los casos que esperaban desde la Fase 1.
RAMA: db/rutinas
DECISIONES: D-075 a D-078, D-081, D-083, D-084 y D-086.
ZONAS PROTEGIDAS: supabase/.

INCLUYE (en una migración nueva):
1. Cinco tablas de negocio según la plantilla, con claves compuestas
   (tenant_id, …) entre ellas:
   - Rutinas: nombre (1 a 80); el cliente (vacío = plantilla; clave
     compuesta a tenant_members); de qué plantilla salió (solo
     informativo); fecha de inicio y bloque desde el que se cuenta
     (D-083); modo, calendario o lista (D-082); cuándo se terminó;
     cuándo se archivó; quién la creó; updated_at.
   - Bloques: rutina, posición, nombre (hasta 40), días del ciclo
     (1 a 28) y vueltas (1 a 52; vacío solo en el último bloque,
     que entonces no tiene fecha de fin, D-075).
   - Días: bloque, número de día dentro del ciclo, entreno o
     descanso, nombre (hasta 40), subtítulo (hasta 60) y lugar
     (hasta 20).
   - Ejercicios del día: día, posición, el ejercicio (clave
     compuesta a los ejercicios del negocio), grupo de superserie
     (opcional, D-077), descanso en segundos (hasta 3.600) y nota
     (hasta 500).
   - Series: ejercicio del día, posición; repeticiones mínima y
     máxima (1 a 100), o tiempo en segundos, o distancia en metros;
     intensidad (ninguna, RIR 0-10, RPE 1-10 con medios, o al fallo);
     carga objetivo en kg (hasta 1.000).
2. Permisos y RLS:
   - El coach (owner y staff) LEE todas las rutinas de su negocio.
   - El cliente LEE solo las rutinas en las que él es el cliente, con
     todo su contenido. Nunca plantillas ni rutinas de otros.
   - Un cliente dado de baja no lee nada (ya lo hace is_member).
   - Nadie escribe directamente en estas tablas desde la app: se
     escriben con funciones (PR 2.6 y 2.12), como las demás
     operaciones sensibles (ARQUITECTURA §8).
   - El cliente pasa a poder leer los ejercicios del negocio que
     aparecen en sus rutinas, y solo esos.
3. La regla de D-072: la forma de medir y "unilateral" de un
   ejercicio no cambian si ya está en alguna rutina.
4. El flag "programs", de tipo core (misma salvedad que en el PR 2.1).
5. Seed: las plantillas de docs/referencia/rutinas-de-ejemplo.md
   ("Casa + Gym" y "Pecho / Espalda y Brazo / Pierna" en Iron Lab;
   "Fuerza básica" en Norte Strength), con sus ejercicios propios.
6. Tests pgTAP:
   - Caso 15: nadie escribe directamente, ni en su negocio ni en el
     de otro; un coach no ve las rutinas de otro negocio.
   - Caso 16: la clave compuesta impide poner a un cliente de otro
     coach en una rutina.
   - Caso 17: la clave compuesta impide usar un ejercicio o un bloque
     de otro negocio.
   - Caso 18: el cliente lee su rutina y no puede crear ni cambiar
     nada.
   - Caso 19: un cliente no ve la rutina de otro cliente del mismo
     coach, ni las plantillas.
   - Caso 28: updated_at cambia solo al editar una rutina.
   - Además: un cliente dado de baja no ve su rutina; el cliente lee
     los ejercicios de su rutina y ningún otro; la regla del punto 3.

NO INCLUYE: las funciones para guardar (PR 2.6) y para asignar (PR
2.12); la regla del día saltado (Fase 3: se añade entonces);
pantallas.

SI PASA DE 300 LÍNEAS, se parte así:
- 2.5a: rutinas, bloques y días, con su RLS y los casos 15, 16, 18,
  19 y 28.
- 2.5b: ejercicios del día y series, la lectura de ejercicios por el
  cliente, la regla del punto 3, el caso 17 y el seed.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. En Studio, las cinco tablas tienen el candado de RLS.
3. En Studio, la tabla de rutinas tiene 3 filas: dos de Iron Lab y
   una de Norte Strength, las tres sin cliente.
4. La descripción del PR dice qué test cubre cada uno de los casos
   15, 16, 17, 18, 19 y 28.
5. La app arranca y se ve igual que antes de este PR.
```

### PR 2.6 — Base de datos: guardar una rutina de una vez

```
TAREA: la función con la que el editor guarda una rutina entera, o
todo o nada.
RAMA: db/guardar-rutina
DECISIONES: D-079 y D-086.
ZONAS PROTEGIDAS: supabase/.

INCLUYE (en una migración nueva):
1. Una función que recibe una rutina completa (sus datos, sus
   bloques, días, ejercicios y series) y la crea o la actualiza en
   una sola operación. Si algo falla, no se guarda nada.
2. Solo la puede usar el coach (owner o staff) del negocio de esa
   rutina. Todos los ejercicios tienen que ser de ese negocio.
3. Conserva los identificadores de lo que no ha cambiado: la Fase 3
   los necesita (D-087). Lo que ya no viene, se borra.
4. Comprueba los topes de D-086 y devuelve un error distinto para
   cada uno.
5. Guardado desde otro dispositivo (D-079): si la rutina cambió desde
   que se cargó, la función no guarda y lo dice.
6. Un ejercicio archivado se puede conservar en una rutina que ya lo
   tenía, pero no añadirse a una rutina nueva (D-073).
7. Archivar y recuperar una plantilla, con el tope de 300 plantillas
   sin archivar.
8. Tests pgTAP de cada regla, y además: un cliente no puede usar la
   función; un coach no puede guardar en el negocio de otro (caso
   15, por función); una rutina de cliente se guarda igual que una
   plantilla, sin cambiar de cliente.

NO INCLUYE: asignar, terminar ni reiniciar (PR 2.12); pantallas.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. La descripción del PR lista qué test cubre cada regla, del punto 2
   al 7.
3. La app arranca y se ve igual que antes de este PR.
```

### PR 2.7 — Rutinas: lista de plantillas

```
TAREA: que el coach vea sus plantillas y pueda crear, renombrar y
archivar una.
RAMA: feat/modulo-programs
DECISIONES: D-075, D-078, D-079 y D-085.

INCLUYE:
1. El módulo programs (npm run new:module programs), en el registro,
   con su README. En el menú del coach: "Rutinas" (orden 20, entre
   Clientes y Ejercicios).
2. /coach/programs: la lista de plantillas por orden alfabético. Cada
   fila: el nombre, "Semanal" o "Ciclo de N días", cuántos días de
   entreno tiene y cuándo se editó por última vez. Con varios
   bloques, "N bloques".
3. Buscador por nombre.
4. "Nueva plantilla": pide el nombre y cuántos días dura el ciclo (7
   por defecto). La crea con un bloque sin fecha de fin y todos sus
   días de descanso, y abre el editor (PR 2.8; hasta entonces,
   vuelve a la lista).
5. Renombrar, archivar y recuperar. Las archivadas se ven con un
   filtro "Archivadas".
6. En model/, el esquema Zod de una rutina completa (el "documento"
   que carga y guarda el editor), con sus tipos y sus tests.
7. Los 4 estados. Vacío: "Aún no tienes plantillas. Crea la primera".

NO INCLUYE: el editor (PR 2.8 a 2.10); la pestaña "Asignadas" (PR
2.13); duplicar una plantilla (PR 2.11).

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com ve "Rutinas" en el menú, entre "Clientes" y
   "Ejercicios". Dentro, dos plantillas: "Casa + Gym" (semanal, 4
   días de entreno) y "Pecho / Espalda y Brazo / Pierna" (ciclo de 8
   días, 4 días de entreno).
2. Creo "Prueba" con un ciclo de 10 días y aparece en la lista como
   "Ciclo de 10 días · 0 días de entreno".
3. La renombro a "Prueba 2" y, tras recargar, sigue así.
4. La archivo: desaparece. Con el filtro "Archivadas" la veo y la
   recupero.
5. coach.norte@example.com solo ve "Fuerza básica".
6. ana@example.com no ve "Rutinas" en su menú, y /coach/programs la
   devuelve a /client.
7. Un negocio recién creado ve "Aún no tienes plantillas. Crea la
   primera".
```

### PR 2.8 — Editor: los días del ciclo

```
TAREA: el editor de una rutina, en su primera parte: los días del
ciclo de un bloque, y guardar sin perder nada.
RAMA: feat/editor-dias
DECISIONES: D-075, D-079 y D-085.

INCLUYE:
1. /coach/programs/:id, el editor. En este PR trabaja con el primer
   bloque de la rutina.
2. Cuántos días dura el ciclo (1 a 28). Con 7 se llama "Semanal" y
   los días son lunes a domingo; con otro número, "Día 1, Día 2…".
3. Cada día: de entreno o de descanso. En los de entreno: nombre,
   subtítulo ("Tirón + pierna") y lugar ("Casa", "Gym"), opcionales.
   Se ve cuántos ejercicios y series tiene cada día.
4. Acortar el ciclo cuando sobran días con contenido pide
   confirmación.
5. "Guardar cambios" (D-079): guarda todo de una vez con la función
   del PR 2.6. El botón solo se activa si hay cambios.
6. Aviso al intentar salir con cambios sin guardar.
7. Recuperación en el dispositivo: si la app se cierra con cambios,
   al volver a abrir esa rutina se ofrece "Recuperar" o "Descartar".
   Lo guardado en el dispositivo se valida con Zod al leerlo y se
   olvida al cerrar sesión.
8. Si la rutina se guardó desde otro dispositivo: "Esta rutina se ha
   cambiado desde otro dispositivo", con "Volver a cargar". No se
   pisa lo guardado.
9. Móvil: la lista de días y, al tocar uno, ese día. Escritorio: los
   días a la izquierda y el día elegido a la derecha.
10. El estado del editor vive en model/ como lógica pura, con tests
    unitarios. Guardar no pierde los ejercicios ni las series que la
    rutina ya tenía, aunque este PR todavía no los enseñe.

NO INCLUYE: añadir o cambiar ejercicios y series (PR 2.9 y 2.10);
varios bloques (PR 2.16); copiar y duplicar (PR 2.11).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.8a: el editor y "Guardar cambios" (puntos 1 a 5, 9 y 10).
  Criterios 1 a 4 y 8.
- 2.8b: aviso al salir, recuperación y guardado desde otro
  dispositivo (puntos 6, 7 y 8). Criterios 5 a 7.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre "Casa + Gym": lunes "Empuje + dorsal +
   bíceps" (Casa, 7 ejercicios, 20 series), martes descanso,
   miércoles "Tirón + pierna" (Gym, 8 ejercicios, 19 series)… como
   en docs/referencia/rutinas-de-ejemplo.md.
2. Abro la de 8 días: los días se llaman "Día 1" a "Día 8".
3. En "Prueba" (PR 2.7) pongo el ciclo en 7 días: pasan a llamarse
   lunes a domingo. Marco lunes y jueves como entreno, les pongo
   nombre y lugar, y guardo. Tras recargar, sigue todo.
4. Guardo "Casa + Gym" tras cambiar el subtítulo del viernes: el
   lunes sigue teniendo 7 ejercicios y 20 series.
5. Cambio algo y pulso "Rutinas" en el menú sin guardar: la app me
   avisa y puedo quedarme.
6. Cambio algo, cierro la pestaña del navegador y vuelvo a abrir la
   rutina: me ofrece "Recuperar" mis cambios.
7. Con la misma rutina abierta en dos ventanas, guardo en una y
   después en la otra: la segunda dice que se cambió desde otro
   dispositivo y no pisa nada.
8. En un móvil hago lo mismo que en el criterio 3.
```

### PR 2.9 — Editor: los ejercicios de cada día

```
TAREA: que el coach ponga los ejercicios de cada día de entreno, en
orden.
RAMA: feat/editor-ejercicios
DECISIONES: D-072, D-073, D-078 y D-080.

INCLUYE:
1. Dentro de un día de entreno, la lista de sus ejercicios en orden,
   con el total arriba ("7 ejercicios · 20 series").
2. "Añadir ejercicio" abre el buscador de ejercicios (el mismo
   buscador y los mismos filtros del PR 2.3) sin salir de la rutina.
   Lo aporta el módulo exercises por su index.ts: programs puede
   usar exercises (ARQUITECTURA §6). Se añade al test de fronteras
   ese caso permitido (estaba apuntado en "Ideas y deuda").
3. Si el ejercicio no existe: "Crear «lo escrito»", sin salir.
4. Un ejercicio recién añadido entra con 3 series sin datos.
5. "Subir" y "Bajar" para ordenar; "Quitar", con confirmación si
   tiene series con datos.
6. "Sustituir": cambia el ejercicio por otro y conserva sus series,
   su descanso y su nota (D-078). Solo ofrece ejercicios que se
   miden igual.
7. La nota del ejercicio (hasta 500 caracteres), que verá el cliente.
8. Un ejercicio archivado que ya estaba en la rutina se ve con la
   etiqueta "Archivado". En el buscador no aparecen los archivados.
9. En el formulario de un ejercicio (PR 2.4), la forma de medir y
   "unilateral" quedan bloqueadas si el ejercicio está en alguna
   rutina, con el texto "Este ejercicio ya está en una rutina. Para
   cambiarlo, duplícalo" (D-072).
10. Todo entra en "Guardar cambios" del PR 2.8.

NO INCLUYE: cambiar las series y la prescripción (PR 2.10); copiar y
duplicar (PR 2.11); superseries (PR 2.17).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.9a: lista, añadir, crear, ordenar y quitar (puntos 1 a 5 y 10).
  Criterios 1 a 4 y 8.
- 2.9b: sustituir, nota, archivados y el bloqueo de la forma de medir
  (puntos 6 a 9). Criterios 5 a 7.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre el lunes de "Casa + Gym" y ve sus 7
   ejercicios en el orden del documento de ejemplo.
2. En "Prueba", en el lunes, añado "Lat pulldown" y "Leg press"
   buscándolos. Cada uno entra con 3 series.
3. Busco "remo con goma", no existe, lo creo sin salir y queda
   añadido al día.
4. Subo el último ejercicio al primer puesto, quito otro y guardo.
   Tras recargar, el orden y la lista siguen igual.
5. Sustituyo "Lat pulldown" por "Neutral-grip lat pulldown": sigue en
   su sitio y con sus 3 series.
6. Archivo "Leg press" en Ejercicios: en "Prueba" se ve con la
   etiqueta "Archivado", y ya no sale en el buscador de la rutina.
7. En Ejercicios, abro "Remo Gironda agarre amplio": no me deja
   cambiar la forma de medir y me dice que lo duplique.
8. En un móvil hago lo mismo que en los criterios 2 y 4.
```

### PR 2.10 — Editor: series y prescripción

```
TAREA: que el coach escriba qué hay que hacer en cada ejercicio:
series, repeticiones, intensidad, carga y descanso.
RAMA: feat/editor-series
DECISIONES: D-072 y D-076.
ZONAS PROTEGIDAS: src/core/tenancy (leer y guardar el ajuste RIR o
RPE en tenants.settings).

INCLUYE:
1. Una línea por ejercicio: número de series (1 a 10), repeticiones
   fijas ("8") o en rango ("8-12"), intensidad, carga objetivo y
   descanso. Solo las series son obligatorias.
2. "Series distintas": despliega la línea y cada serie se escribe por
   separado. Se puede volver a "todas iguales" (toma la primera).
3. Intensidad: RIR (0 a 10), RPE (1 a 10, con medios) o "Al fallo".
4. El ajuste "Intensidad: RIR o RPE" en los Ajustes del coach, solo
   para el dueño. Por defecto, RIR. Cambiarlo no convierte lo ya
   escrito (D-076).
5. Según la forma de medir del ejercicio (D-072): con "tiempo" se
   escriben segundos en vez de repeticiones; con "distancia", metros.
   Con "peso corporal", la carga es el lastre.
6. La carga se escribe en la unidad del usuario (kg o lb) y se guarda
   en kg (core/lib/units).
7. El descanso se elige en minutos y segundos, con atajos (1:00,
   1:30, 2:00, 3:00).
8. Un resumen de una línea de cada ejercicio, "3 × 8-12 · RIR 1 ·
   2:00", como lógica pura en model/ con tests. Lo usarán la vista
   del cliente y la ficha.
9. Validación con Zod y los topes de D-086. Todo entra en "Guardar
   cambios".

NO INCLUYE: porcentaje del RM ni tempo (D-076); superseries (PR
2.17); que el cliente apunte nada (Fase 3).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.10a: la línea única, "series distintas", repeticiones,
  intensidad y descanso (puntos 1, 2, 3, 7, 8 y 9). Criterios 1 a 4.
- 2.10b: el ajuste RIR o RPE, la carga en kg o lb y las formas
  tiempo y distancia (puntos 4, 5 y 6). Criterios 5 a 8.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre el miércoles de "Casa + Gym".
   "Machine preacher curl" (en español, "Curl predicador en
   máquina") se lee "2 × 8-12 · RIR 1 · 2:00".
2. "Remo Gironda agarre amplio" aparece desplegado: la primera serie
   de 6-8 y las otras dos de 10-12.
3. En "Prueba" pongo un ejercicio en 4 series de 10 con 1:30 de
   descanso, guardo y, tras recargar, sigue igual.
4. Despliego ese ejercicio, cambio la última serie a "Al fallo" y
   guardo: el resumen ya no dice una sola línea para todas.
5. En Ajustes cambio a RPE: en un ejercicio nuevo se me ofrece RPE.
   Los que tenían RIR siguen diciendo RIR.
6. "Flexiones con mochila" (lunes) muestra una carga de 22 lb. Si
   cambio mi unidad a kilos, muestra 10 kg.
7. Añado "Plank" y me pide segundos, no repeticiones.
8. Intento poner 11 series y no me deja.
```

### PR 2.11 — Copiar y duplicar

```
TAREA: que el coach pueda copiar su trabajo, en pequeño y en grande.
RAMA: feat/copiar-y-duplicar
DECISIONES: D-078 y D-080.

INCLUYE:
1. Duplicar un ejercicio dentro de un día (con sus series).
2. Duplicar un día en otro día del mismo ciclo. Si el día de destino
   ya tiene ejercicios, pide confirmación antes de sustituirlos.
3. Copiar y pegar entre rutinas: "Copiar" un ejercicio o un día en
   una rutina y "Pegar" en otra. Lo copiado se guarda en el
   dispositivo y se olvida al cerrar sesión.
4. Duplicar una plantilla entera desde la lista: crea "Copia de …".
5. Las operaciones de copia son lógica pura en model/, con tests
   unitarios. Lo pegado y lo duplicado entra en "Guardar cambios".

NO INCLUYE: duplicar y copiar bloques (PR 2.16, cuando existen
varios); asignar (PR 2.13); arrastrar para reordenar (D-080).

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com, en "Prueba", duplica un ejercicio: aparece
   debajo, con las mismas series.
2. Duplico el lunes en el jueves: el jueves queda igual que el lunes,
   con su nombre, su lugar, sus ejercicios y sus series.
3. Duplico el lunes en un día que ya tiene ejercicios: me pide
   confirmación antes de sustituirlos.
4. En "Casa + Gym" copio el miércoles; abro "Prueba" y lo pego en el
   viernes. Guardo y, tras recargar, el viernes de "Prueba" tiene los
   8 ejercicios del miércoles.
5. En la lista, duplico "Casa + Gym": aparece "Copia de Casa + Gym"
   con los mismos días. Cambiar la copia no cambia la original.
6. En un móvil hago lo mismo que en los criterios 2 y 4.
```

### PR 2.12 — Base de datos: asignar

```
TAREA: las funciones con las que una rutina llega a un cliente y se
gestiona después.
RAMA: db/asignar-rutinas
DECISIONES: D-078, D-081, D-082 y D-083.
ZONAS PROTEGIDAS: supabase/.

INCLUYE (en una migración nueva):
1. Asignar una plantilla a uno o a varios clientes: cada uno recibe
   su copia completa. Se indican la fecha de inicio y el modo.
2. Crear una rutina vacía para un cliente, sin plantilla (D-078).
3. Las reglas de D-081, en la propia función:
   - Solo a clientes activos de ese negocio.
   - Con fecha de hoy o pasada: la rutina vigente del cliente queda
     terminada (pasa a "Anteriores").
   - Con fecha futura: queda como "próxima" y sustituye a la próxima
     que hubiera.
   - La rutina vigente de un cliente es la no terminada con la fecha
     de inicio más reciente que no sea futura. No hay ninguna tarea
     programada: se calcula al leer.
4. Terminar la rutina vigente y cancelar la próxima.
5. Reiniciar desde una fecha y desde un bloque (D-083).
6. Guardar la rutina de un cliente como plantilla nueva (D-078).
7. Solo el coach (owner o staff) del negocio. Cada operación deja
   constancia en audit_log, sin datos personales.
8. A un cliente dado de baja no se le puede asignar ni reiniciar
   nada. Sus rutinas se conservan (D-083).
9. Seed: Ana tiene "Casa + Gym" (calendario); Bruno, "Pecho /
   Espalda y Brazo / Pierna" (calendario); Carla, ninguna; Diego,
   "Fuerza básica" en modo lista; Elena, "Fuerza básica" como
   próxima, para dentro de 7 días; Fran (dado de baja), "Fuerza
   básica" de antes de su baja. Las fechas, relativas al día en que
   se carga el seed.
10. Tests pgTAP de cada regla, y además: un coach no puede asignar a
    un cliente de otro negocio (caso 16, por función) ni usar la
    plantilla de otro (caso 17, por función); un cliente no puede
    usar ninguna de estas funciones (caso 18); tras asignar, cada
    cliente ve solo su copia (caso 19); el cliente dado de baja no
    ve la suya.

NO INCLUYE: la regla del día saltado (Fase 3); pantallas.

SI PASA DE 300 LÍNEAS, se parte así:
- 2.12a: asignar, crear vacía y las reglas de vigente y próxima
  (puntos 1, 2, 3, 7 y 8), con sus tests y el seed.
- 2.12b: terminar, cancelar, reiniciar y guardar como plantilla
  (puntos 4, 5 y 6), con sus tests.

CRITERIOS DE ACEPTACIÓN:
1. npm run db:reset y npm run db:test terminan sin errores.
2. En Studio, la tabla de rutinas tiene las 3 plantillas y 5 rutinas
   con cliente: Ana, Bruno, Diego, Elena y Fran.
3. La descripción del PR dice qué test cubre cada regla y cada caso
   (16, 17, 18 y 19).
4. La app arranca y se ve igual que antes de este PR.
```

### PR 2.13 — Asignar a clientes y pestaña "Asignadas"

```
TAREA: que el coach asigne una plantilla a sus clientes y vea de un
vistazo qué rutina tiene cada uno.
RAMA: feat/asignar-rutinas
DECISIONES: D-075, D-081, D-082 y D-085.

INCLUYE:
1. El cálculo del calendario, como lógica pura en model/ con tests
   unitarios: dada una rutina (bloques, ciclo y vueltas), su fecha de
   inicio, el bloque desde el que se cuenta y la fecha de hoy, dice
   en qué bloque, en qué vuelta y en qué día va, y cuándo termina
   cada bloque. Cubre desde ya: varios bloques; el bloque semanal de
   lunes a domingo con la primera semana a medias (D-075); el último
   bloque, que se repite; y una rutina que aún no ha empezado.
2. "Asignar", en una plantilla: se eligen uno o varios clientes
   activos (la lista la da core/tenancy), la fecha de inicio (hoy por
   defecto) y el modo, "Con calendario" o "Lista".
3. Antes de confirmar, el resumen: cuándo termina ("Termina el 13 de
   diciembre" o "Se repite hasta que la cambies") y, si alguno ya
   tiene rutina, el aviso "Ana ya tiene la rutina X. Pasará a
   Anteriores".
4. La pestaña "Asignadas" en /coach/programs, junto a "Plantillas":
   cada cliente activo con su rutina vigente, el bloque y la vuelta
   en los que va y cuándo termina; su rutina próxima, si la tiene; o
   "Sin rutina". Buscador por nombre de cliente.
5. Los 4 estados. Vacío: "Aún no tienes clientes".
6. En móvil el diálogo ocupa la pantalla; en escritorio, una ventana.

NO INCLUYE: la pestaña de la ficha del cliente y sus acciones (PR
2.14); lo que ve el cliente (PR 2.15); asignar desde cero, sin
plantilla (PR 2.14).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.13a: el cálculo del calendario y el diálogo de asignar (puntos 1,
  2, 3 y 6). Criterios 3 a 6.
- 2.13b: la pestaña "Asignadas" (puntos 4 y 5). Criterios 1, 2 y 7.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre "Rutinas" → "Asignadas": Ana con "Casa
   + Gym", Bruno con "Pecho / Espalda y Brazo / Pierna" y Carla "Sin
   rutina".
2. coach.norte@example.com ve a Diego con "Fuerza básica" y a Elena
   con "Fuerza básica" como próxima, con su fecha.
3. Como coach.iron, asigno "Casa + Gym" a Carla con fecha de hoy:
   Carla pasa a tener "Casa + Gym".
4. Asigno "Prueba" a Ana y a Bruno a la vez: antes de confirmar me
   avisa de que los dos ya tienen rutina. Al confirmar, los dos
   tienen "Prueba".
5. Asigno una plantilla a Carla para dentro de 10 días: aparece como
   próxima y su rutina vigente no cambia.
6. Después de asignar, cambio "Casa + Gym" (la plantilla): la rutina
   de Carla no cambia.
7. coach.iron no ve a Diego ni a Elena en ninguna parte.
```

### PR 2.14 — Ficha del cliente: pestaña "Rutina"

```
TAREA: que el coach gestione la rutina de un cliente desde su ficha.
RAMA: feat/rutina-en-la-ficha
DECISIONES: D-078, D-079, D-081, D-083 y D-085.
ZONAS PROTEGIDAS: src/core/modules (para que la ficha pinte las
pestañas que aportan los módulos; estaban previstas en el manifest y
nadie las pinta todavía).

INCLUYE:
1. El mecanismo de pestañas: la ficha del cliente (módulo clients)
   pinta las pestañas que declaran los módulos activos en su
   manifest, sin que clients importe a ningún otro módulo
   (ARQUITECTURA §5 y §6). Sustituye al texto provisional de la
   ficha.
2. La pestaña "Rutina", que aporta programs:
   - La rutina vigente: nombre, bloque y vuelta en los que va, modo,
     fecha de inicio y sus días, en lectura.
   - La próxima, si la hay, y las anteriores (solo el nombre y las
     fechas).
   - Sin rutina: "Este cliente no tiene rutina", con "Asignar una
     plantilla" y "Crear desde cero".
3. "Editar": abre el editor de los PR 2.8 a 2.11 sobre la copia de
   ese cliente. Arriba se ve de quién es ("Rutina de Ana").
4. Acciones: "Asignar una plantilla" (el diálogo del PR 2.13, con el
   cliente ya elegido), "Crear desde cero", "Reiniciar desde una
   fecha" (fecha y bloque), "Terminar", "Cancelar la próxima" y
   "Guardar como plantilla". Las destructivas piden confirmación.
5. Cliente dado de baja: se ven sus rutinas, sin ninguna acción, con
   el texto "Reactívalo para asignarle una rutina" (D-083).

NO INCLUYE: la pestaña de progreso (Fase 3); notas privadas sobre el
cliente (D-087).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.14a: el mecanismo de pestañas y la pestaña en lectura, con
  "Editar" (puntos 1, 2 y 3). Criterios 1 a 3 y 7.
- 2.14b: las acciones y el cliente dado de baja (puntos 4 y 5).
  Criterios 4 a 6.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre la ficha de Ana: la pestaña "Rutina"
   muestra "Casa + Gym", en qué vuelta va y sus días.
2. Pulso "Editar", cambio "Hip thrust" por "Glute bridge" con
   "Sustituir" y guardo. La plantilla "Casa + Gym" sigue teniendo
   "Hip thrust".
3. La ficha de Carla dice "Este cliente no tiene rutina". Con "Crear
   desde cero" le hago una rutina de un día y queda como su rutina.
4. "Guardar como plantilla" en la rutina de Ana crea una plantilla
   nueva en "Rutinas".
5. "Reiniciar desde una fecha" en la rutina de Bruno, con fecha de
   dentro de 5 días: la ficha dice que empieza ese día.
6. "Terminar" la rutina de Ana: pasa a "Anteriores" y Ana queda sin
   rutina.
7. coach.norte@example.com abre la ficha de Fran (dado de baja): ve
   su rutina y ninguna acción.
```

### PR 2.15 — El cliente ve su rutina

```
TAREA: que el cliente vea su rutina en modo lectura: qué toca hoy,
los días y cada ejercicio.
RAMA: feat/rutina-del-cliente
DECISIONES: D-074, D-082 y D-084.

INCLUYE:
1. /client/program, con "Entreno" en la barra del cliente (la primera
   entrada).
2. Con calendario: la tarjeta "Hoy toca" con el nombre del día, su
   subtítulo, su lugar y "8 ejercicios · 19 series"; o "Hoy:
   descanso". Debajo, los días del ciclo del bloque actual, con el de
   hoy marcado. El cliente puede abrir cualquier día.
3. Modo lista: los días de entreno en orden, sin fechas ni "Hoy
   toca".
4. El día: sus ejercicios en orden, cada uno con su resumen ("3 ×
   8-12 · RIR 1 · 2:00", PR 2.10) y la nota del coach.
5. El ejercicio: sus series una a una, la nota, las instrucciones y
   el botón "Ver vídeo", que abre el enlace fuera de la app (D-074).
   Las cargas, en la unidad del cliente.
6. Los nombres de los ejercicios del catálogo, en el idioma del
   cliente (D-071).
7. Estados: cargando; error con "Reintentar"; "Tu coach aún no te ha
   asignado una rutina"; "Tu rutina empieza el …" (rutina próxima o
   reiniciada con fecha futura).
8. Todo en lectura. No hay "Iniciar entreno" (Fase 3).
9. Test de extremo a extremo (flujo crítico "asignar rutina",
   AGENTS.md §6): el coach asigna una plantilla a una clienta y la
   clienta la ve al entrar.

NO INCLUYE: apuntar series, cronómetro, historial ni gráficas (Fase
3); rutinas anteriores (Fase 3); bloques futuros (D-084; la línea
"El siguiente bloque empieza el…" llega en el PR 2.16); la tarjeta
en el inicio del cliente (PR 2.18).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.15a: "Entreno" con calendario y el día (puntos 1, 2, 4, 6, 7 y
  8). Criterios 1, 2, 5, 6 y 7.
- 2.15b: el ejercicio, el modo lista y el test de extremo a extremo
  (puntos 3, 5 y 9). Criterios 3, 4 y 8.

CRITERIOS DE ACEPTACIÓN:
1. ana@example.com ve "Entreno" en su barra. Dentro, "Hoy toca" con
   el día de "Casa + Gym" que corresponde a hoy (o "Hoy: descanso" si
   es martes, jueves o domingo), y los siete días de la semana.
2. Abro el miércoles: 8 ejercicios, empezando por "Remo Gironda
   agarre amplio".
3. Abro "Remo Gironda agarre amplio": tres series, la primera de 6-8
   y las otras dos de 10-12.
4. diego@example.com (modo lista) ve sus días de entreno en orden,
   sin "Hoy toca".
5. carla@example.com ve "Tu coach aún no te ha asignado una rutina".
6. elena@example.com ve "Tu rutina empieza el …", con la fecha.
7. Ana no puede cambiar nada: no hay ningún botón de editar ni de
   apuntar.
8. bruno@example.com (libras) ve en libras la carga que el coach
   escribió; ana@example.com (kilos), en kilos.
9. Con Ana dentro, el coach le cambia un ejercicio y guarda. Cuando
   Ana vuelve a la app, ve el cambio.
```

### PR 2.16 — Varios bloques

```
TAREA: que una rutina pueda cambiar cada semana, cada mes o cada
cierto tiempo: varios bloques seguidos.
RAMA: feat/bloques
DECISIONES: D-075, D-080, D-084 y D-085.

INCLUYE:
1. En el editor, la lista de bloques de la rutina. Con un solo
   bloque no cambia nada de lo que ya había.
2. "Añadir bloque": vacío o "Duplicar el anterior". Se elige su
   duración con atajos ("1 semana", "2 semanas", "4 semanas") o
   escribiendo las vueltas (1 a 52). Se ve cuántos días son. Solo
   el último bloque puede quedar "Sin fecha de fin"; al añadir un
   bloque detrás de uno sin fin, el editor pide la duración de ese.
3. Cada bloque: nombre opcional, su ciclo y sus vueltas. "Subir" y
   "Bajar" para ordenarlos; "Quitar", con confirmación.
4. Duplicar un bloque, y copiarlo y pegarlo entre rutinas (lo que el
   PR 2.11 dejó para este).
5. Al asignar y en "Asignadas": "Bloque 2 de 4" y cuándo termina. El
   último bloque se sigue repitiendo.
6. El cliente ve solo el bloque actual y la línea "El siguiente
   bloque empieza el …" (D-084).
7. "Reiniciar desde una fecha" ya deja elegir el bloque (PR 2.14):
   se comprueba con una rutina de varios bloques.
8. El tope de 12 bloques (D-086).

NO INCLUYE: bloques que cambien solos las cargas; la regla del día
saltado (Fase 3).

SI PASA DE 300 LÍNEAS, se parte así:
- 2.16a: los bloques en el editor (puntos 1 a 4 y 8). Criterios 1 a
  4.
- 2.16b: los bloques al asignar, en "Asignadas" y para el cliente
  (puntos 5, 6 y 7). Criterios 5 a 7.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com abre "Casa + Gym": sigue viéndose como
   antes, con un solo bloque.
2. En "Prueba" pongo el primer bloque en "4 semanas" y añado un
   segundo con "Duplicar el anterior": tiene los mismos días. Le
   cambio un ejercicio y guardo.
3. Añado un tercer bloque con un ciclo de 8 días y 2 vueltas: dice
   "16 días".
4. Subo el tercer bloque al segundo puesto y, tras guardar y
   recargar, sigue ahí.
5. Asigno "Prueba" a Carla con fecha de hoy: en "Asignadas" veo
   "Bloque 1 de 3" y cuándo termina.
6. carla@example.com ve los días del primer bloque y "El siguiente
   bloque empieza el …". No ve los ejercicios del segundo.
7. Le reinicio la rutina a Carla desde hoy en el bloque 2: Carla ve
   los días del segundo bloque.
```

### PR 2.17 — Superseries

```
TAREA: que el coach pueda agrupar ejercicios que se hacen seguidos,
sin descanso entre ellos.
RAMA: feat/superseries
DECISIONES: D-077.

INCLUYE:
1. En el editor, en un ejercicio: "Agrupar con el siguiente". Dos
   ejercicios agrupados se marcan como "Superserie"; tres o más, como
   "Circuito". "Desagrupar" lo deshace.
2. Solo se agrupan ejercicios seguidos del mismo día. Al mover, quitar
   o sustituir un ejercicio, el grupo se mantiene coherente (un
   grupo de uno deja de ser grupo). Lógica pura en model/, con tests.
3. El cliente ve los ejercicios agrupados juntos, con la misma marca.
4. Duplicar y copiar (PR 2.11) conservan los grupos.

NO INCLUYE: cambios en la base de datos (el grupo existe desde el PR
2.5); un descanso propio del grupo; series por tiempo tipo EMOM o
AMRAP.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com, en "Prueba", agrupa dos ejercicios
   seguidos: quedan marcados como "Superserie". Guardo y, tras
   recargar, siguen agrupados.
2. Agrupo un tercero: la marca pasa a "Circuito".
3. Quito uno de los tres: vuelve a "Superserie". Quito otro: el que
   queda ya no está agrupado.
4. "Desagrupar" los deja sueltos y en el mismo orden.
5. La clienta que tiene esa rutina ve los dos ejercicios juntos, con
   la marca "Superserie".
```

### PR 2.18 — Inicio: avisos del coach y "Hoy toca" del cliente

```
TAREA: que el inicio de cada perfil enseñe lo importante de sus
rutinas, y cerrar la Fase 2.
RAMA: feat/inicio-con-rutinas
DECISIONES: D-084 y D-085.
ZONAS PROTEGIDAS: src/core/modules (para que un módulo pueda aportar
una tarjeta al inicio de cada perfil, igual que aporta rutas, menú y
pestañas). Si la forma del manifest cambia, se enseña al propietario
antes: el ejemplo de ARQUITECTURA §5 es orientativo.

INCLUYE:
1. El mecanismo: un módulo declara en su manifest una tarjeta para el
   inicio del coach o del cliente. Las carcasas (app/coach y
   app/client) las pintan sin importar a ningún módulo.
2. Inicio del coach, la tarjeta de avisos (D-085): clientes cuyo
   último bloque termina en los próximos 7 días o ya se está
   repitiendo, y clientes activos sin rutina. Cada línea lleva a la
   ficha de ese cliente. Sin avisos: "Todos tus clientes tienen
   rutina".
3. Inicio del cliente: la tarjeta "Hoy toca" (o "Hoy: descanso", o
   los otros estados del PR 2.15), que lleva a "Entreno".
4. Se quitan los textos provisionales de los dos inicios.
5. docs/ESTADO.md y CONTEXTO.md: la Fase 2 queda terminada, y la
   siguiente tarea es diseñar la Fase 3.

NO INCLUYE: emails ni notificaciones (P-07); nada de la Fase 3.

CRITERIOS DE ACEPTACIÓN:
1. coach.iron@example.com ve en su inicio una tarjeta con Carla "Sin
   rutina" (con el seed recién cargado). Al tocarla va a la ficha de
   Carla.
2. Asigno a Carla una rutina de un bloque de 1 semana: en el inicio
   aparece como "Termina bloque el …".
3. Le asigno a Carla "Casa + Gym" (sin fecha de fin): ya no hay
   avisos y veo "Todos tus clientes tienen rutina".
4. ana@example.com ve en su inicio la tarjeta "Hoy toca" y, al
   tocarla, llega a "Entreno".
5. carla@example.com, sin rutina, ve en su inicio "Tu coach aún no te
   ha asignado una rutina".
6. Ningún inicio dice ya "llega en la Fase 3" ni textos de ejemplo.
```
