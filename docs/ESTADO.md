# ESTADO DEL PROYECTO

**Última actualización:** 2026-11-14
**Fase actual:** 1 — Cuentas, negocio del coach y unirse con código (la Fase 0 terminó y se fusionó el 2026-11-13)

Este archivo lo actualiza quien termina una tarea, en el mismo Pull Request, junto con `CONTEXTO.md` (que resume este en una página).

## En curso

PR abiertos, apilados y esperando revisión (D-064). Se fusionan en este orden:

1. Diseño de la Fase 1 (rama `docs/diseno-fase-1`, PR 4).
2. PR 1.2 — Base de datos: cuentas y emails (rama `db/cuentas-y-emails`, PR 5).
3. PR 1.3 — Sesión y login con contraseña (rama `feat/sesion-y-login`, PR 6).
4. PR 1.4 — Tenant y rol reales, y guardas de ruta (rama `feat/tenancy-real`, PR 7).
5. PR 1.5 — Flags reales (rama `feat/flags-reales`, PR 8).
6. PR 1.6 — Recuperar la contraseña y entrar con un código por email (rama `feat/recuperar-y-codigo`, PR 9).
7. PR 1.7 — Registro y verificación del email (rama `feat/registro`, PR 10).
8. PR 1.8 — Base de datos: invitaciones, bajas y negocio (rama `db/invitaciones-y-bajas`, PR 11).
9. PR 1.9a — Primera pantalla y unirse con código (rama `feat/unirse-con-codigo`, PR 12).
10. PR 1.9b — Unirse al crear la cuenta (rama `feat/unirse-tras-registro`, PR 13).
11. PR 1.10 — Módulo `clients`: lista y código de invitación (rama `feat/modulo-clients`, PR 14).
12. PR 1.11 — Dar de baja y reactivar a un cliente (rama `feat/baja-de-clientes`, PR 15).
13. PR 1.12 — Crear negocio y primeros pasos del coach (rama `feat/crear-negocio`, PR 16).
14. PR 1.13 — Perfil y cuenta (rama `feat/perfil`, PR 17).
15. PR 1.14 — Selector de espacio y "Mis espacios" (rama `feat/selector-de-espacio`, PR 18).
16. PR 1.15 — Marca: nombre, colores y modo (rama `feat/marca-del-coach`, PR 19).
17. PR 1.16 — Marca: logo (rama `feat/logo-del-coach`, PR 20).
18. PR 1.17 — Staging y emails reales: **preparado, en borrador** (rama `chore/staging`). Tiene la guía paso a paso, las variables de staging y `npm run dev:staging`. Se termina con el propietario siguiendo la guía.

## Siguiente

1. Fase 1, PR 1.17 — terminar staging con el propietario: **antes hacen falta** el dominio (P-01) y las cuentas de Supabase y Resend. La guía está en `supabase/README.md`, "Guía: poner en marcha staging". Al terminarla, la Fase 1 queda hecha.

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

### Fase 1 — Cuentas, negocio del coach y unirse con código

El diseño está en DECISIONES D-036 a D-064, y el detalle de cada PR, en `docs/PROMPTS.md` §5.

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
- [ ] PR 1.17 — Staging y emails reales (necesita el dominio, P-01)

### Fase 2 — Ejercicios y rutinas (coach)

- [ ] Módulo `exercises`: biblioteca y ejercicios propios
- [ ] Módulo `programs`: crear, editar, duplicar y asignar rutinas

### Fase 3 — Entreno y progreso (cliente)

- [ ] Módulo `workouts`: el cliente ve su rutina y registra series, cargas y RPE
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

- Falta el dominio de la web (DECISIONES, P-01). No bloquea hasta el PR 1.17: sin dominio no se pueden enviar emails reales. Hasta entonces todo se prueba en local.
- Los textos legales de la Fase 1 son borradores: ningún usuario real puede registrarse hasta tener los definitivos (D-060).
- Supabase en plan gratuito (D-063): sin copias de seguridad recuperables. Hay que revisar el plan antes del primer usuario real.
- Proteger `main` (GUIA-GIT §12) no es posible todavía: en un repositorio privado GitHub lo exige de pago (GitHub Pro, gratis con el Student Developer Pack). Mientras tanto protege el hook local que bloquea subir a `main`. Ya está activo: solo "Squash merge" y borrar la rama al fusionar.

## Ideas y deuda

Cosas que alguien ha visto y que no tocaban en su tarea. No se hacen sin convertirlas antes en tarea.

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
- Test de fronteras: añadir el caso permitido de la tabla de dependencias entre módulos cuando existan dos módulos reales (`programs` → `exercises`).
- Zod ocupa buena parte del peso de la app. Si el tamaño llega a importar, valorar su variante ligera.
- Un test pgTAP que pruebe cada política de UPDATE por separado (`tenants_update` y `profiles_update`). Hoy, si se afloja una, la política de lectura sigue bloqueando (Postgres la aplica en los UPDATE con WHERE) y los tests no lo notan. No es un agujero, pero la segunda capa no está vigilada. (`members_update` ya no existe: desde el PR 1.8, dar de baja y reactivar van por función.)
- Los casos 15 a 19 y 28 de `docs/referencia/pruebas-aislamiento.sql` se escriben con la primera tabla de negocio (`programs`, Fase 2).

## Registro de cambios

Lo más nuevo, arriba.

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
