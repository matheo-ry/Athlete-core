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
9. PR 1.9a — Primera pantalla y unirse con código (rama `feat/unirse-con-codigo`).

## Siguiente

1. Fase 1, PR 1.9b — Recordar el código mientras se crea la cuenta, la marca del coach en las pantallas de cuenta y el alta automática. El prompt está en `docs/PROMPTS.md` §5, con los 16 PR de la fase en orden.

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
- [ ] PR 1.9 — Primera pantalla y unirse con código (partido en dos, como preveía `docs/PROMPTS.md` §5)
  - [x] 1.9a — `/start`, vista previa del coach, unirse con sesión, todos los mensajes de D-054 y el tope de intentos
  - [ ] 1.9b — recordar el código al crear la cuenta, marca del coach en las pantallas de cuenta y alta automática
- [ ] PR 1.10 — Módulo `clients`: lista y código de invitación
- [ ] PR 1.11 — Dar de baja y reactivar a un cliente
- [ ] PR 1.12 — Crear negocio y primeros pasos del coach
- [ ] PR 1.13 — Perfil y cuenta
- [ ] PR 1.14 — Selector de espacio y "Mis espacios"
- [ ] PR 1.15 — Marca: nombre, colores y modo
- [ ] PR 1.16 — Marca: logo
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
