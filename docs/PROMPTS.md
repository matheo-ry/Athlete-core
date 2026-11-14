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

El diseño está decidido en `docs/DECISIONES.md` (D-036 a D-063). Se piden **en este orden y de uno en uno**: cada PR sale de `main` con el anterior ya fusionado.

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
   cuenta sin confirmar pasa a /verify con un código nuevo.
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
2. La pantalla de crear negocio: el nombre (de 2 a 60 caracteres) y la
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
2. Ana pone el idioma en inglés: la app cambia al momento. Cierra
   sesión, vuelve a entrar y sigue en inglés. Si pide un código por
   email, llega en inglés.
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
