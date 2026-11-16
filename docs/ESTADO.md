# ESTADO DEL PROYECTO

**Última actualización:** 2026-11-15
**Fase actual:** 2 — Ejercicios y rutinas: lotes 1 (ejercicios) y 2 (plantillas y editor de días) fusionados en `main`; lote 3 en marcha (la Fase 1 terminó y se fusionó el 2026-11-14)

Este archivo lo actualiza quien termina una tarea, en el mismo Pull Request, junto con `CONTEXTO.md` (que resume este en una página).

## En curso

Nada. **El lote 3 está completo:** los PR 2.9a (#36), 2.9b (#37), 2.10a (#38), 2.10b (#39) y 2.11 (rama `feat/copiar-y-duplicar`) están abiertos, apilados en ese orden. Los lotes 1 (#24 a #28) y 2 (#30 a #35) están fusionados en `main` desde el 2026-11-15; el lote 2 se fusionó a petición del propietario sin que lo probara antes.

## Siguiente

1. **El propietario prueba los lotes 2 y 3** ("Al terminar el lote", `docs/PROMPTS.md` §6: montar entera su rutina real, con ejercicios y series, y copiarla) y da el visto bueno para fusionar los PR 2.9a a 2.11, en orden (D-064). Que revise los cambios en `src/core/` de los PR 2.8b (D-099) y 2.10b (D-103). Después, el lote 4: PR 2.12 — Base de datos: asignar.
2. El propietario prueba el lote 2 en la app y revisa el cambio en `src/core/` del PR 2.8b (D-099). Si algo no le gusta, se arregla en un PR nuevo.
3. El propietario aplica en staging las migraciones 8 a 14 (GUIA-GIT §9). No bloquea seguir.
4. El propietario dio por buenas, por ahora, la lista de `docs/referencia/biblioteca-ejercicios.md` y las rutinas de ejemplo. Se pueden retocar más adelante.

## Fases

### Fase 0 — Esqueleto (sin funciones de producto) — ✅ terminada el 2026-11-13

- [x] Proyecto base (Vite + React + TypeScript estricto)
- [x] Estructura de carpetas de ARQUITECTURA §4 y §5
- [x] ESLint con fronteras, Prettier, Husky, lint-staged, commitlint
- [x] Comandos de npm de ARQUITECTURA §13
- [x] `core/` mínimo: config, i18n, ui, branding, lib, modules, flags y tenancy (con datos de ejemplo)
- [x] Carcasas de coach y de cliente, con selector de perfil solo en desarrollo
- [x] Módulo `_template` y `npm run new:module`
- [x] Tests configurados (Vitest y Playwright) con ejemplos reales
- [x] `supabase init` (sin tablas) y Capacitor configurado (sin plataformas)
- [x] CI en GitHub Actions
- [x] Versiones anotadas en DECISIONES.md

Además de lo previsto, a petición del propietario:

- [x] Cliente de Supabase en `core/supabase`, sin usar todavía (DECISIONES D-025)
- [x] Tests que vigilan las reglas: fronteras de arquitectura, textos en dos idiomas y forma fija de los módulos (DECISIONES D-024 y D-029)

### Fase 1 — Cuentas, negocio del coach y unirse con código — ✅ terminada el 2026-11-14

El diseño está en DECISIONES D-036 a D-067, y el detalle de cada PR, en `docs/PROMPTS.md` §5.

- [x] PR 1.1 — Supabase local, primera migración y tests de aislamiento en el CI (53 tests pgTAP; las tablas y funciones nuevas nacen sin permisos, D-032)
- [x] Decidir cómo se entra y cómo funciona toda la fase (D-035 a D-064)
- [x] PR 1.2 — Base de datos: cuentas y emails
- [x] PR 1.3 — Sesión y login con contraseña
- [x] PR 1.4 — Tenant y rol reales, y guardas de ruta
- [x] PR 1.5 — Flags reales
- [x] PR 1.6 — Recuperar la contraseña y entrar con un código por email
- [x] PR 1.7 — Registro y verificación del email
- [x] PR 1.8 — Base de datos: invitaciones, bajas y negocio
- [x] PR 1.9 — Primera pantalla y unirse con código (partido en dos, como preveía `docs/PROMPTS.md` §5)
  - [x] 1.9a — `/start`, vista previa del coach, unirse con sesión, todos los mensajes de D-054 y el tope de intentos
  - [x] 1.9b — recordar el código al crear la cuenta, marca del coach en las pantallas de cuenta y alta automática
- [x] PR 1.10 — Módulo `clients`: lista y código de invitación
- [x] PR 1.11 — Dar de baja y reactivar a un cliente
- [x] PR 1.12 — Crear negocio y primeros pasos del coach
- [x] PR 1.13 — Perfil y cuenta
- [x] PR 1.14 — Selector de espacio y "Mis espacios"
- [x] PR 1.15 — Marca: nombre, colores y modo
- [x] PR 1.16 — Marca: logo
- [x] PR 1.17 — Staging y emails reales

### Fase 2 — Ejercicios y rutinas

El diseño está en DECISIONES D-069 a D-088, y el detalle de cada PR, en `docs/PROMPTS.md` §6. Son 18 PR en 5 lotes: un lote no empieza hasta que el anterior está fusionado con el visto bueno del propietario (D-069).

- [x] Decidir cómo funciona toda la fase (D-069 a D-088)

**Lote 1 — Ejercicios**

- [x] PR 2.1 — Base de datos: ejercicios (sin el flag `exercises`, que llega con el módulo en el PR 2.3)
- [x] PR 2.2 — Los 120 ejercicios de la plataforma
- [x] PR 2.3 — Ejercicios: lista, buscador y filtros (con el flag `exercises`)
- [x] PR 2.4 — Crear, editar, archivar y recuperar ejercicios (partido en dos, como preveía su bloque)
  - [x] 2.4a — crear y editar
  - [x] 2.4b — archivar, recuperar, duplicar y restaurar

**Lote 2 — Plantilla**

- [x] PR 2.5 — Base de datos: rutinas (partido en dos, como preveía `docs/PROMPTS.md` §6)
  - [x] 2.5a — rutinas, bloques y días, con su RLS y los casos 15, 16, 18, 19 y 28
  - [x] 2.5b — ejercicios del día y series, la lectura de ejercicios por el cliente, la regla de D-072, el caso 17 y el seed
- [x] PR 2.6 — Base de datos: guardar una rutina de una vez
- [x] PR 2.7 — Rutinas: lista de plantillas
- [x] PR 2.8 — Editor: los días del ciclo (partido en dos, como preveía `docs/PROMPTS.md` §6)
  - [x] 2.8a — el editor y "Guardar cambios", con el aviso de guardado desde otro dispositivo
  - [x] 2.8b — aviso al salir con cambios sin guardar y recuperación en el dispositivo

**Lote 3 — Rellenar la rutina**

- [x] PR 2.9 — Editor: los ejercicios de cada día (partido en dos, como preveía `docs/PROMPTS.md` §6)
  - [x] 2.9a — lista, añadir con el buscador, crear sin salir, ordenar y quitar
  - [x] 2.9b — sustituir, nota, archivados y bloquear la forma de medir
- [x] PR 2.10 — Editor: series y prescripción (partido en dos, como preveía `docs/PROMPTS.md` §6)
  - [x] 2.10a — la línea única, "Series distintas", repeticiones (o segundos, o metros), intensidad, descanso y el resumen
  - [x] 2.10b — el ajuste RIR o RPE y la carga en kg o lb
- [x] PR 2.11 — Copiar y duplicar
- [x] PR 2.11b — Los ejercicios del día, de uno en uno (añadido tras la prueba del propietario, D-106)
- [x] PR 2.11c — El menú del coach y la lista de días acompañan al bajar (añadido tras la prueba del propietario)

**Lote 4 — Asignar y verla como cliente**

- [ ] PR 2.12 — Base de datos: asignar
- [ ] PR 2.13 — Asignar a clientes y pestaña "Asignadas"
- [ ] PR 2.14 — Ficha del cliente: pestaña "Rutina"
- [ ] PR 2.15 — El cliente ve su rutina

**Lote 5 — Bloques y remates**

- [ ] PR 2.16 — Varios bloques
- [ ] PR 2.17 — Superseries
- [ ] PR 2.18 — Inicio: avisos del coach y "Hoy toca" del cliente

### Fase 3 — Entreno y progreso (cliente)

La referencia es la app de apuntes del propietario (D-087). Antes de empezar se decide P-12 (datos de salud y menores).

- [ ] Módulo `workouts`: el cliente inicia el entreno de hoy y registra series, cargas y RIR o RPE, con cronómetro de descanso
- [ ] Aplicar la regla del día saltado y dejar apuntado qué día hizo el cliente (D-082)
- [ ] El coach revisa los entrenos de cada cliente
- [ ] Módulo `progress`: gráficas, RM estimado y récords
- [ ] Tests de flujos completos en el CI

### Fase 4 — Pilotos

- [ ] Proyectos nativos de Android e iOS
- [ ] Compilación de iOS en la nube y TestFlight
- [ ] Publicación de la web
- [ ] Avisos de errores y de caídas
- [ ] Borrar la cuenta desde dentro de la app (lo piden las tiendas) y que un cliente pueda darse de baja de un coach
- [ ] Borrar para siempre los datos de un cliente dado de baja, y descargar los propios datos (D-055 y D-060)
- [ ] Entrar con Google y con Apple (D-047)
- [ ] Que el enlace de invitación abra la app instalada, y entrar con un enlace por email (D-039 y D-051)
- [ ] Textos legales definitivos: privacidad, términos, condiciones para coaches y reembolsos. Hacen falta antes del primer usuario real (D-060)
- [ ] Cuentas de desarrollador de Apple y de Google (comprobar los requisitos de prueba previa de Google Play y empezar pronto)
- [ ] 3–5 coaches piloto usando la app

### Fase 5 — Planes y pagos

- [ ] Suscripción del coach y límites por plan
- [ ] Cobros del coach a sus clientes

## Bloqueos y dudas abiertas

- **El nicho es provisional** (D-070, P-02): el propietario hablará con 3–5 coaches cuando tenga la demo. Las preguntas están en D-070.
- Resend en plan gratuito: 100 emails al día y 3.000 al mes (D-046). Hay que revisarlo antes de los pilotos.
- Staging se pausa tras una semana sin uso (D-063). Si deja de responder, es eso: se reanuda desde el panel de Supabase con **Restore project** (guía de staging, paso 6).
- El proyecto de staging está conectado al repositorio de GitHub (comprobación "Supabase Preview", siempre omitida). No se sabe si fue a propósito; no hace nada. Se quita en el panel de Supabase, Settings → Integrations.
- En local, repetir muchas veces seguidas los tests de extremo a extremo agota los topes de intentos y de emails por hora, y fallan con "Demasiados intentos". Se arregla con `npm run db:reset` (D-065).
- Los textos legales de la Fase 1 son borradores: ningún usuario real puede registrarse hasta tener los definitivos (D-060).
- Supabase en plan gratuito (D-063): sin copias de seguridad recuperables. Hay que revisar el plan antes del primer usuario real.
- Proteger `main` (GUIA-GIT §12) no es posible todavía: en un repositorio privado GitHub lo exige de pago (GitHub Pro, gratis con el Student Developer Pack). Mientras tanto protege el hook local que bloquea subir a `main`. Ya está activo: solo "Squash merge" y borrar la rama al fusionar.

## Ideas y deuda

Cosas que alguien ha visto y que no tocaban en su tarea. No se hacen sin convertirlas antes en tarea.

- Tests que fallan a ratos (2026-11-15): con el ordenador cargado (dos servidores de la app abiertos), algunos tests unitarios antiguos agotan su tiempo (`SignupPage`, `JoinAfterSignup`, `ExercisePanel`) y `npm run check` falla sin que el código tenga nada mal; al repetir, pasan. Además, 1 de 5 pasadas completas de `npm run test:e2e` tuvo un fallo que no se pudo reproducir. Habría que mirar si conviene subir el límite de tiempo o bajar el número de tests a la vez.
- En la pantalla de un código de coach que no existe (`/join`), dejar a la vista "Ya tengo cuenta" y "Soy coach", como en la primera pantalla (lo echó en falta el propietario al probar staging).
- Los tests pgTAP en staging necesitan la contraseña de la base de datos, porque el usuario temporal de la CLI no busca en el esquema `extensions`. Se evitaría fijando el `search_path` en la cabecera de cada test.
- Que el coach pueda elegir un código de invitación propio y fácil de recordar (D-050).
- Que el coach vea el email de sus clientes, si lo piden para distinguir nombres repetidos (D-059).
- Avisar por email al cliente cuando su coach lo da de baja o lo reactiva (D-055).
- Foto de perfil y cambiar el email de la cuenta (D-058).
- Recortar o encuadrar el logo dentro de la app (PR 1.16 no lo incluye).
- Borrar los archivos de logos que quedaran sueltos en Storage si, al cambiar el logo, falla el borrado del anterior (hoy solo se registra).
- Que los clientes vean la marca nueva al momento con la app abierta, sin tener que volver a ella (necesitaría una conexión en tiempo real).
- Borrar solas las cuentas que llevan días sin confirmar el email.
- Captcha en las pantallas sin sesión, si el tope de intentos por dirección IP no basta (D-052).
- Qué ven los miembros de un negocio suspendido o cancelado (llega con los pagos, Fase 5).
- Que el coach pueda apagar desde sus ajustes las funciones que no use (ARQUITECTURA §9).
- Alta de un segundo coach (`staff`) en el mismo negocio.
- Pasar a TypeScript 7 cuando el lint de TypeScript lo admita (DECISIONES D-022).
- Detectar con lint los textos escritos directamente en un componente (AGENTS.md, regla 7). Hoy se revisa a mano. Haría falta una librería nueva.
- Añadir reglas de accesibilidad al lint (etiquetas, botones de verdad). Haría falta una librería nueva.
- Zod ocupa buena parte del peso de la app. Si el tamaño llega a importar, valorar su variante ligera.
- Un test pgTAP que pruebe cada política de UPDATE por separado (`tenants_update` y `profiles_update`). Hoy, si se afloja una, la política de lectura sigue bloqueando (Postgres la aplica en los UPDATE con WHERE) y los tests no lo notan. No es un agujero, pero la segunda capa no está vigilada. (`members_update` ya no existe: desde el PR 1.8, dar de baja y reactivar van por función.)
- Los casos 15 a 19 y 28 de `docs/referencia/pruebas-aislamiento.sql` se escriben en los PR 2.1 (hecho: 15, 18 a medias y 28, para `exercises`), 2.5, 2.6 y 2.12: cada bloque de `docs/PROMPTS.md` §6 dice cuáles.
- Las listas cerradas de ejercicios (grupo, material y forma de medir) están escritas dos veces en la migración 8, una por tabla. Si cambian, hay que cambiar las dos (y el esquema Zod del PR 2.4).
- La copia del catálogo pasa por el tope de 1.000 ejercicios: si el catálogo crece y algún negocio está casi en el tope, la migración fallaría. Decidir entonces si las copias de la plataforma se lo saltan (D-090).
- Chat entre coach y cliente, y fotos del cliente guardadas para que el coach las vea (lo pidió el propietario al diseñar la Fase 2). El chat está fuera de la primera versión (ARQUITECTURA §14) y las fotos dependen de P-12.
- Importar rutinas desde Excel. Antes, algo más sencillo: pegar una lista de texto ("Remo Gironda — 3 series") y que la app la convierta en ejercicios (D-088).
- Reordenar ejercicios, días y bloques arrastrando, además de con "Subir" y "Bajar". El propietario quiere valorarlo; haría falta una librería (D-080).
- Porcentaje del RM y tempo en la prescripción (D-076).
- Subir vídeos de ejercicios, en vez de solo un enlace (D-074).
- Seguir en otro dispositivo una rutina a medio editar: borrador guardado en la nube (D-079).
- Notas privadas del coach sobre un cliente. Dependen de P-12, porque acabarían guardando lesiones (D-087).
- Imprimir una rutina o exportarla a PDF, y compartir plantillas entre coaches (D-088).
- Que la semana pueda empezar en domingo, si lo piden los coaches de EE. UU. (D-075).
- La lista de ejercicios pide como mucho 1.000 filas (`max_rows` de la API). Primero van los activos, que nunca pasan de 1.000; con más de 1.000 entre activos y archivados, faltarían archivados. Se arreglaría pidiendo los archivados aparte o por páginas (D-091).
- Quitar tildes y mayúsculas para buscar está escrito dos veces, en `clients/model` y en `exercises/model`. Si lo necesita un tercer módulo, subirlo a `core/lib`.
- El desplegable `FilterSelect` y el campo de varias líneas `TextArea` viven en el módulo `exercises` (D-091 y D-092). Cuando otro módulo los necesite (el editor de rutinas, seguramente), subirlos a `core/ui`, con el visto bueno del propietario.
- Comprobar en la Fase 4 que "Ver vídeo" abre el navegador del sistema dentro de la app móvil (hoy abre una pestaña nueva, D-074).
- Crear varios ejercicios seguidos sin que el formulario se cierre ("Guardar y crear otro"), si los coaches lo piden (D-092).
- Buscar un ejercicio del catálogo también por su nombre en el otro idioma, si los coaches lo piden (hoy solo cuenta el que se ve, D-091).

## Registro de cambios

Lo más nuevo, arriba.

- 2026-11-16 — PR 2.11c (menú y días a la vista): en escritorio, el menú lateral del coach y la lista de días del editor acompañan al bajar por la página. Pedido por el propietario al probar el PR 2.11b.
- 2026-11-16 — PR 2.11b (un ejercicio cada vez): al probar el lote 3, el propietario vio que bajar por todos los ejercicios de un día cansa. Ahora hay una fila con los números de los ejercicios y debajo solo el elegido; en el móvil se pasa al de al lado deslizando. Al añadir, duplicar, pegar o mover, se ve el ejercicio afectado (D-106).
- 2026-11-15 — PR 2.11 (copiar y duplicar): duplicar un ejercicio; duplicar un día en otro del mismo ciclo, con confirmación si el destino tiene ejercicios; copiar un ejercicio o un día y pegarlo en otra rutina (se guarda en el dispositivo y se olvida al cerrar sesión); y duplicar una plantilla entera desde la lista ("Copia de …"). La lógica, en `model/copy.ts`. 7 tests unitarios y 2 de extremo a extremo nuevos. Detalles en D-104. Cierra el lote 3.

- 2026-11-15 — PR 2.10b (editor: el ajuste RIR o RPE y la carga): "Entrenamiento" en los Ajustes del coach, solo para el dueño, para elegir RIR o RPE (se guarda en `tenants.settings`; `useTenantSettings` y `useSaveTenantSettings` en `core/tenancy`); el editor ofrece la escala elegida sin convertir lo ya escrito; y la carga objetivo, escrita en kg o lb y guardada en kg ("Lastre" en los ejercicios de peso corporal). Toca `src/core/tenancy` (lo pedía el bloque) y los textos de `src/core/i18n`. 9 tests unitarios y 2 de extremo a extremo nuevos. Detalles en D-103.

- 2026-11-15 — PR 2.10a (editor: series y prescripción): en cada ejercicio, número de series (1 a 10), repeticiones fijas o en rango (o segundos, o metros, según la forma de medir), intensidad (RIR o al fallo) y descanso con atajos; "Series distintas" y "Todas iguales"; y el resumen de una línea, "3 × 8-12 · RIR 1 · 2:00", en `model/prescription.ts`. 17 tests unitarios y 2 de extremo a extremo nuevos. Detalles en D-102.

- 2026-11-15 — PR 2.9b (editor: sustituir, nota y archivados): "Sustituir" cambia un ejercicio por otro que se mide igual y conserva sus series, su descanso y su nota; la nota del ejercicio, que verá el cliente; la etiqueta "Archivado" en los que se archivaron después; y en el formulario de un ejercicio que está en una rutina, la forma de medir y "unilateral" quedan bloqueadas con el aviso de duplicarlo. 6 tests unitarios y 2 de extremo a extremo nuevos. Detalles en D-101.

- 2026-11-15 — PR 2.9a (editor: los ejercicios de cada día): dentro de un día de entreno, sus ejercicios en orden con el total arriba; "Añadir ejercicio" con el buscador y los filtros de "Ejercicios" sin salir de la rutina (el módulo exercises lo ofrece por su `index.ts`: `ExercisePicker` y `useExerciseOptions`); "Crear «lo escrito»" sin salir; cada ejercicio nuevo entra con 3 series vacías; "Subir", "Bajar" y "Quitar" (con confirmación si tiene algo escrito). El test de fronteras ya prueba `programs` → `exercises`. 10 tests unitarios, 2 de fronteras y 3 de extremo a extremo nuevos. Detalles en D-100.
- 2026-11-15 — Lote 2 de la Fase 2 fusionado en `main` (#30 a #35), a petición del propietario, que pidió hacerlo y fusionarlo en el mismo chat.
- 2026-11-15 — PR 2.8b (editor: que no se pierdan los cambios): con cambios sin guardar, salir a otra pantalla pide confirmación y cerrar la pestaña muestra el aviso del navegador; los cambios se quedan en el dispositivo y, al volver a abrir la rutina, se ofrece "Recuperar" o "Descartar"; se borran al cerrar sesión con `clearDeviceDrafts()` (toca `src/core/lib` y `src/core/tenancy`, D-099). Arregla además dos fallos del 2.8a: "Cambios guardados" se quedaba a la vista tras volver a cambiar algo, y salir mientras se guardaba dejaba la navegación a medias. 10 tests unitarios y 1 de extremo a extremo nuevos. Cierra el lote 2.
- 2026-11-15 — PR 2.8a (editor: los días del ciclo): `/coach/programs/<id>` con el ciclo (1 a 28 días; con 7, de lunes a domingo), cada día de entreno o de descanso con su nombre, subtítulo y lugar, y cuántos ejercicios y series tiene; "Guardar cambios" de una vez, sin perder los ejercicios ni las series; confirmación al acortar el ciclo o al marcar como descanso un día con ejercicios; aviso si se guardó desde otro dispositivo. En el móvil, la lista de días y, al tocar uno, ese día. "Nueva plantilla" abre el editor. 14 tests unitarios y 2 de extremo a extremo nuevos. Detalles en D-098.
- 2026-11-15 — PR 2.7 (rutinas: lista de plantillas): módulo `programs` con "Rutinas" en el menú del coach (entre Clientes y Ejercicios), la lista de plantillas con su ciclo y sus días de entreno, buscador, "Nueva plantilla", renombrar, archivar y recuperar; el esquema Zod del documento de una rutina en `model/`; y el flag `programs`. 18 tests unitarios y 4 de extremo a extremo nuevos. Detalles en D-097.
- 2026-11-15 — PR 2.6 (base de datos: guardar una rutina de una vez): `save_program` guarda la rutina entera o nada, conserva los identificadores, comprueba los topes de D-086 con un error distinto para cada uno y no pisa lo guardado desde otro dispositivo; `set_program_archived` archiva y recupera plantillas, con el tope de 300. 47 tests pgTAP nuevos. Detalles en D-096.
- 2026-11-15 — PR 2.5b (base de datos: ejercicios del día, series y seed): tablas `program_day_exercises` y `program_sets`, de solo lectura; el cliente pasa a leer los ejercicios de sus rutinas y ningún otro; la forma de medir de un ejercicio que está en una rutina ya no cambia (`exercise_in_use`). El seed trae las tres plantillas de `docs/referencia/rutinas-de-ejemplo.md` y 20 ejercicios propios de Iron Lab. 46 tests pgTAP nuevos (casos 15, 17, 18 y 19). Detalles en D-095. El test 09 borra antes las rutinas del seed.
- 2026-11-15 — PR 2.5a (base de datos: rutinas, bloques y días): tablas `programs`, `program_blocks` y `program_days`, de solo lectura desde la app (se escribirán con funciones), con RLS: el coach lee las de su negocio y el cliente, solo las suyas; un cliente dado de baja no lee nada. 45 tests pgTAP nuevos (casos 15, 16, 18, 19 y 28). Detalles en D-094. El propietario pidió hacer los PR 2.5 a 2.8 en el mismo chat.
- 2026-11-15 — Lote 1 de la Fase 2 fusionado en `main` (#24 a #28) con el visto bueno del propietario, que lo probó en la app. Antes se revisó entero desde cero y se arregló un test del panel de ejercicios que fallaba a ratos (esperar al foco).
- 2026-11-15 — PR 2.4b (archivar, recuperar, duplicar y restaurar): en el panel del ejercicio, "Duplicar" (copia propia con todo, "… (copia)", y abre su formulario), "Restaurar original" (solo en los del catálogo que han cambiado; con confirmación, porque quita las instrucciones y el vídeo) y "Archivar" o "Recuperar" (nunca se borra). La lista carga los datos del catálogo de cada ejercicio para saber si ha cambiado. Detalles en D-093. Sin migraciones. 17 tests unitarios nuevos (436 en total) y 1 de extremo a extremo (48). Cierra el lote 1.
- 2026-11-15 — PR 2.4a (crear y editar ejercicios): "Nuevo ejercicio", editar cualquier ejercicio pulsando su fila y "Crear «lo escrito»" cuando una búsqueda no encuentra nada. Formulario con nombre y forma de medir obligatorios, unilateral, grupo, material, instrucciones y enlace de vídeo (solo `https://`, D-074), validado con Zod con los límites de la migración 8. En el móvil sustituye a la lista; en escritorio, panel a su lado. Un ejercicio del catálogo editado sin tocar el nombre se sigue viendo en el idioma de cada uno. Detalles en D-092. Sin migraciones. 19 tests unitarios nuevos (419 en total) y 2 de extremo a extremo (47). El PR 2.4 se partió en dos, como preveía su bloque.

- 2026-11-15 — PR 2.3 (lista de ejercicios): módulo `exercises` con "Ejercicios" en el menú del coach (orden 30). `/coach/exercises` muestra los ejercicios del negocio por orden alfabético, con grupo, material y las etiquetas "Unilateral" y "Propio"; los del catálogo sin cambiar, en el idioma de la app (D-071). Pestañas "Activos" y "Archivados" con su número, buscador sin tildes ni mayúsculas y filtros de grupo, material y origen, combinables y hechos en la app (D-073); los 4 estados. Migración 10 con el flag `exercises` (D-089). Detalles en D-091. 26 tests unitarios nuevos (400 en total) y 2 de extremo a extremo (45). Solo lectura: crear, editar y archivar llegan en el PR 2.4.
- 2026-11-15 — PR 2.2 (los 120 ejercicios de la plataforma): migración 9 con las 120 filas de `docs/referencia/biblioteca-ejercicios.md` en `exercise_library`, tal cual (las filas salen del documento con un script), y la copia para los negocios que ya existen con `copy_exercise_library_to_all_tenants()`, que se puede repetir sin duplicar nada y no toca lo que el coach haya cambiado (D-090). Sin instrucciones ni vídeos (D-074). 11 tests pgTAP nuevos (202 en total); el test 09 usa ahora un catálogo propio de una fila. En local, Iron Lab y Norte Strength tienen 120 ejercicios cada uno.
- 2026-11-15 — PR 2.1 (base de datos: ejercicios): migración 8 con `exercise_library` (el catálogo de la plataforma, solo lectura, vacío hasta el PR 2.2) y `exercises` (los de cada negocio). Listas cerradas de D-072; el coach lee, crea y edita, nadie borra (D-073) y el cliente todavía no lee nada; cada negocio nuevo recibe la copia del catálogo con un trigger propio; tope de 1.000 sin archivar (D-086). 41 tests pgTAP nuevos (191 en total), con los casos 15, 18 (crear) y 28. Los detalles, en D-089. El flag `exercises` se deja para el PR 2.3.

- 2026-11-15 — Diseño de la Fase 2: decisiones D-069 a D-088 (catálogo de 120 ejercicios con una copia para cada negocio; rutinas por bloques con ciclos de 1 a 28 días; series una a una; plantillas que se copian a cada cliente; "Guardar cambios" de una vez; una rutina vigente por cliente; el cliente ve su rutina en lectura), la lista de los 18 PR en 5 lotes en `docs/PROMPTS.md` §6, la biblioteca y las rutinas de ejemplo en `docs/referencia/`, P-04 cerrado y P-02 provisional. Solo documentación: sin código ni migraciones. Queda pendiente que el propietario apruebe el cambio de ARQUITECTURA §8.
- 2026-11-14 — Fase 1 fusionada en `main`: los 18 PR (del 4 al 21), en orden y con "Squash and merge", por un agente con el visto bueno del propietario (D-068). En cada uno se comprobó que `main` quedaba con el contenido exacto de la rama. Dos tropiezos, ninguno del código: un test de una rama intermedia (`JoinAfterSignup`) que a veces falla por lentitud y pasó al repetirlo, y un fallo de Docker en el CI de GitHub que pasó al relanzarlo.
- 2026-11-14 — PR 1.17 (staging, terminado): proyecto `athlete-core-staging` en Fráncfort, plan gratuito, con las 7 migraciones, los datos inventados y los 150 tests pgTAP en verde. Emails por Resend desde `no-reply@athlete-core.com` (dominio en Cloudflare, con SPF, DKIM y DMARC). Probado por el propietario: registro y recuperar la contraseña con emails de verdad, en Gmail y en Outlook, sin caer en spam. El tope de intentos cuenta la IP real de cada conexión (D-052): no hizo falta ninguna migración. D-063 revisada: sin cambios. Guía corregida: Resend va antes que `config push`, y los tests en staging piden la contraseña de la base de datos. Cerrado P-01. Los agentes fusionan con el visto bueno del propietario (D-068).
- 2026-11-14 — PR 1.17 (staging, preparado): guía paso a paso en `supabase/README.md` (crear el proyecto en la UE, aplicar migraciones y datos inventados, configurar las cuentas con `config push`, conectar Resend, probar y reanudar si se pausa); las variables de staging en `.env.example`; `npm run dev:staging`. Comprobado en la CLI de Supabase 3.1 que los comandos de la guía existen. Falta seguirla con el propietario: necesita el dominio y las cuentas.
- 2026-11-14 — PR 1.16 (logo): en "Marca", subir, cambiar y quitar el logo (PNG, JPG o WebP de 2 MB como máximo), con vista previa antes de guardar. Se ve en la cabecera, el selector, "Mis espacios", la vista previa del código y el registro con marca; sin logo, o si no carga, las iniciales. Migración 7: espacio `logos` en Storage (público; solo el dueño escribe en la carpeta de su negocio; el propio Storage rechaza otros formatos y más de 2 MB), `set_logo` y `remove_logo`. 19 tests pgTAP nuevos (150 en total). El test de humo del idioma pasa a hacerse sin sesión: con sesión cambiaba el idioma de la cuenta de `coach.iron` y otro test que entraba a la vez la veía en español.
- 2026-11-14 — PR 1.15 (marca): "Marca" en los ajustes del coach, solo para el dueño: nombre del negocio (cambia también el de la marca), color principal y de acento (12 de la paleta o uno propio, escrito o con la rueda de colores), modo claro u oscuro, una vista previa que cambia antes de guardar y "Volver a los colores de ATHLETE CORE". Migración 6 con `update_brand`, que valida cada dato; `name` y `branding` ya no se cambian a mano (D-067). 14 tests pgTAP nuevos (131 en total).
- 2026-11-14 — PR 1.14 (espacios): con varios espacios y ninguno elegido en el dispositivo, el selector `/select` (primero el negocio propio, cada uno con su distintivo y "Coach" o "Cliente"); el elegido se recuerda en el dispositivo y se olvida al cerrar sesión (D-066). "Mis espacios" en el perfil y en los ajustes: cambiar de espacio, "Añadir un coach con código" y "Crear mi negocio". Al unirse a un coach o crear el negocio se entra en el espacio nuevo sin pasar un momento por la bienvenida (antes pasaba, y un test fallaba de vez en cuando por eso). `coach.iron@example.com` ve ahora el selector al entrar.
- 2026-11-14 — PR 1.13 (perfil y cuenta): "Perfil" en el menú del cliente y "Mi cuenta" en los Ajustes del coach, con nombre (lo ve el coach en su lista), idioma (se guarda en la cuenta: al entrar en otro dispositivo, la app se pone en ese idioma, y los emails llegan en él), kilos o libras, el email (solo se ve), cambiar la contraseña (pide la actual salvo a quien entró con un código; cierra los demás dispositivos y llega un aviso por email), los textos legales y "Cerrar sesión", que sale de la cabecera. El cliente ve "Powered by ATHLETE CORE". En el seed, todos los usuarios tienen la cuenta en inglés (lo esperan los tests) salvo carla, en español.
- 2026-11-14 — PR 1.12 (crear negocio): "¿Eres coach?" lleva al registro y, al confirmar, a crear el negocio (nombre y condiciones para coaches, en borrador); el coach llega a su zona con la marca de ATHLETE CORE y su nombre, y una tarjeta de primeros pasos que desaparece con su primer cliente. "Ajustes" en el menú del coach (de momento, vacío). Los tests unitarios esperan 3 segundos en vez de 1 (fallaban por lentitud con todos a la vez).
- 2026-11-14 — PR 1.11 (bajas): ficha del cliente con "Dar de baja" (con confirmación) y "Reactivar" (avisa si el plan está lleno); el cliente dado de baja ve "Ya no tienes acceso a …" con la marca de la plataforma y tres salidas; los espacios salen de `my_spaces` y se piden otra vez cada vez que se vuelve a la app, así una baja se nota con la app abierta.
- 2026-11-14 — PR 1.10 (módulo `clients`): el primer módulo del producto. `/coach/clients` con pestañas "Activos" y "Dados de baja", buscador, plazas del plan con aviso de plan lleno, etiqueta "Nuevo" y la tarjeta del código (copiar, compartir el enlace y regenerar con confirmación, solo el dueño). Flag `clients` en una migración. La lista de miembros, el código y el plan, en `core/tenancy`. Variable opcional `VITE_PUBLIC_APP_URL` para los enlaces.
- 2026-11-14 — PR 1.9b (unirse al crear la cuenta): el código se recuerda 7 días mientras se crea y se confirma la cuenta; esas pantallas se ven con la marca del coach; al terminar, el alta se hace sola; "/" retoma un alta a medias; cerrar sesión olvida el código.
- 2026-11-14 — PR 1.9a (unirse con código): primera pantalla `/start`; `/join?code=…` con la vista previa del coach pintada con su marca, con sesión y sin ella; "Unirme" con un mensaje para cada caso de D-054; `/welcome` con el código y "Crear mi negocio" (aviso "Disponible pronto" hasta el PR 1.12). En el PR 1.8, topes más altos por conexión para el wifi de un gimnasio (D-065).
- 2026-11-14 — PR 1.8 (base de datos): códigos de 8 caracteres sin los que se confunden; vista previa sin sesión; unirse con un resultado por caso y sin reactivar a los dados de baja; tope de 10 códigos equivocados; dar de baja y reactivar solo por función (comprueba el plan); `my_spaces`; `create_tenant` con condiciones para coaches y marca inicial. Seed con plan lleno, una coach que es también clienta y un cliente dado de baja. 117 tests pgTAP.
- 2026-11-14 — PR 1.7 (registro): `/signup` con nombre, email, contraseña y la casilla de los términos; `/verify` con el código; al confirmar vale siempre la última contraseña (D-043, con test de extremo a extremo); avisos de cuenta que ya existe o pendiente; textos legales en borrador; unidad de peso inicial según el dispositivo (D-058).
- 2026-11-14 — PR 1.6 (códigos por email): `/reset-password` (email, código y contraseña nueva; cierra las demás sesiones) y `/login/code` (entrar sin contraseña). Piezas comunes `EmailStep`, `CodeStep` y `NewPasswordStep`; "Enviar otro código" a los 60 segundos; tests de extremo a extremo que leen el código real de la bandeja local.
- 2026-11-14 — PR 1.5 (flags reales): `core/flags` lee `tenant_effective_features` del espacio activo; el módulo de ejemplo se monta en desarrollo sin flag. El router se crea una sola vez con todas las rutas y cada módulo va detrás de su flag (`ModuleGate`); la tenancy y los flags ya no ocultan las pantallas mientras cargan, esperan las guardas (`RequireProfile`, `RequireFlags`). Así una pantalla a medias no pierde lo escrito al cambiar la sesión o el espacio. Cerrar sesión ya no da error si falla el aviso al servidor: la sesión del dispositivo se borra antes.
- 2026-11-14 — PR 1.4 (tenancy real): `core/tenancy` lee los espacios del usuario de la base de datos, la marca del negocio se aplica al tema, guardas por rol (`RequireProfile`) en `/coach`, `/client` y `/welcome`, "/" lleva a cada uno a su sitio. Desaparecen los datos de ejemplo de tenancy y la barra de desarrollo.
- 2026-11-14 — PR 1.3 (sesión y login): `core/auth` con la sesión guardada en el dispositivo, `/login` con los mensajes de D-043, guardas `RequireAuth` y `RequireGuest`, cerrar sesión, aviso de sesión caducada, cierre a los 30 días sin uso, franja "Sin conexión", variables de Supabase obligatorias y tests de extremo a extremo contra Supabase local.
- 2026-11-14 — PR 1.2 (base de datos: cuentas y emails): confirmar el email es obligatorio, con código de 6 dígitos; las 4 plantillas de email en dos idiomas; el perfil nace con los datos del registro; `accept_terms`; `email_status` con tope de intentos; 24 tests pgTAP nuevos (77 en total).
- 2026-11-14 — Diseño de la Fase 1: decisiones D-036 a D-064 (primero el código del coach y después la cuenta, email verificado con código de 6 dígitos, dar de baja a un cliente, marca, perfil, protección de datos mínima y plan gratuito de Supabase), la lista de los 16 PR en `docs/PROMPTS.md` §5, P-09 y P-11 cerrados, D-035 completada, y ARQUITECTURA §7, §8 y §10 y el glosario de AGENTS.md actualizados con la aprobación del propietario.
- 2026-11-13 — PR 1.1 (base de datos): Supabase local con los comandos `db:*`, primera migración desde `esquema-base.sql` con privilegios por defecto cerrados (D-032), 53 tests pgTAP, seed con 2 coaches y 5 clientes, tipos generados y job "Base de datos" en el CI.
- 2026-11-13 — Fase 0 terminada: proyecto base, estructura de carpetas, calidad (ESLint con fronteras, Prettier, hooks de Git), `core/` mínimo con datos de ejemplo, carcasas de coach y de cliente, módulo `_template`, tests (Vitest y Playwright), `supabase init`, Capacitor y CI. Versiones y decisiones en `docs/DECISIONES.md` (D-021 a D-031).
- 2026-11-12 — Nombre de la app decidido: ATHLETE CORE (DECISIONES D-021).

- 2026-11-12 — Añadido `CONTEXTO.md` (resumen para cada chat nuevo) y la forma de trabajar con chats (`EMPEZAR-AQUI.md` Parte 3, `docs/PROMPTS.md` §0).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git y esquema base de referencia.
