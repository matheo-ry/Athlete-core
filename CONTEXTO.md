# CONTEXTO — léelo al empezar cada chat

> Resumen de una página para que cualquier chat nuevo (Claude o Gemini) sepa en qué punto está el proyecto sin depender de conversaciones anteriores.
> Lo actualiza quien termina una tarea, en el mismo Pull Request. Máximo unas 80 líneas: si crece, se resume. El detalle completo está en `docs/`.

## La app

- **ATHLETE CORE**: app para **coaches de gimnasio (foco en fuerza)** y sus clientes.
- **Una sola app** para web, iOS y Android, con dos perfiles:
  - **Coach**: crea rutinas, asigna, sigue el progreso de sus clientes y personaliza su marca.
  - **Cliente**: entra con el código de su coach, ve la marca de su coach y registra sus entrenos.
- Cada coach es un **tenant**: sus datos están aislados de los demás en la propia base de datos.
- Idiomas: inglés y español. Mercados: España para validar; EE. UU., Reino Unido, Canadá, Australia y Europa para vender.

## Cómo está montada

- **Tecnología:** React + Vite + TypeScript, Tailwind, TanStack Query, Zod, i18next, Supabase (Postgres con RLS), Capacitor para móvil.
- **Carpetas:** `src/core/` (cimientos, zona protegida), `src/modules/<función>/` (una carpeta por función, cada una con `coach/`, `client/`, `shared/`, `api/`, `model/` e `i18n/`), `src/app/` (rutas y carcasas de coach y cliente).
- **Seguridad:** toda tabla de negocio lleva `tenant_id` y RLS. Lo delicado (crear negocio, unirse con código) va por funciones de la base de datos.
- **Git:** una tarea = una rama = un Pull Request. `main` protegida. Commits en formato Conventional Commits, en español.

## Dónde estamos

- **Fase actual:** 2 — Ejercicios y rutinas, **terminada y fusionada en `main`** (lotes 1 a 5, PR #24 a #28, #30 a #35, #36 a #42, #43 a #48, #50 a #52). La Fase 1 está terminada y fusionada en `main` (2026-11-14).
- **Última tarea terminada:** `fix(db): compatibilidad de tests pgTAP en staging con permisos de postgres` (399 tests pasando en verde al 100% en local y en staging).
- **En curso:** nada.
- **Siguiente tarea:** **diseñar la Fase 3** (entreno y progreso del cliente) con el propietario; antes decidir P-12 (datos de salud y menores). En staging, todas las migraciones 1 a 16 están aplicadas y probadas.

## Cómo será la Fase 2 (diseñada, D-069 a D-088)

- **Ejercicios:** la plataforma trae 120 y cada negocio recibe su copia, que el coach edita, archiva y recupera como suya; además crea los propios. Vídeo, solo con enlace.
- **Rutinas:** rutina → bloques → días del ciclo (de 1 a 28; 7 es "semanal") → ejercicios → series, guardadas una a una. Las plantillas se copian a cada cliente; un cliente tiene una sola rutina vigente. El editor guarda todo de una vez.
- **El cliente** ve su rutina en modo lectura ("Hoy toca…"). Apuntar entrenos es la Fase 3.
- **Cómo se trabaja:** 18 PR en 5 lotes, de unas 300 líneas de verdad. Un lote no empieza hasta que el anterior está fusionado con el visto bueno del propietario.

## Cómo funciona la Fase 1 (hecha)

- **Primero el código, después la cuenta:** la primera pantalla (`/start`) pide el código del coach; debajo, "Ya tengo cuenta" y "Soy coach" (D-037).
- **Cuentas:** nombre, email y contraseña. El email se confirma con un código de 6 dígitos; con ese mismo sistema se entra sin contraseña y se recupera la contraseña. Los emails no llevan enlaces (D-038 a D-044).
- **Dar de baja:** el coach quita el acceso a un cliente y puede reactivarlo; nunca borra su cuenta (D-055).
- **Espacios:** una cuenta puede ser coach y cliente a la vez, y cliente de varios coaches (D-048 y D-056). Con varios, se entra en el último usado en el dispositivo o se elige en el selector (D-066).

## Qué existe ya

- **La app arranca** (`npm run db:start`, `npm run dev`; ver `README.md`) con los usuarios inventados del seed. Hace falta `.env.local` (ver `.env.example`). Inglés y español.
- **`core/`:** variables de entorno validadas, i18n, componentes base, marca → variables de tema (con corrección de contraste), unidades kg/lb, fechas, logger, `defineModule`, sesión, tenancy y flags reales, y el cliente de Supabase.
- **Cuentas** (PR 1.2, 1.3, 1.6 y 1.7): registro con el email confirmado por un código de 6 dígitos, entrar con contraseña o con un código, recuperar la contraseña, sesión guardada en el dispositivo y cierre a los 30 días sin uso. Los 4 emails van en dos idiomas (`supabase/templates/`; en local se ven en `http://127.0.0.1:54324`).
- **Unirse con código** (PR 1.8 y 1.9): `/start`, `/join?code=…` con la vista previa del coach y "Unirme"; el código se recuerda mientras se crea la cuenta y el alta se hace sola al terminar. Con tope de intentos.
- **Módulo `clients`** (PR 1.10 y 1.11): el primero del producto. Lista de clientes con las plazas del plan, el código de invitación y la ficha con dar de baja y reactivar.
- **Crear negocio** (PR 1.12): desde "¿Eres coach?" o la bienvenida, con primeros pasos en el inicio del coach.
- **Perfil y cuenta** (PR 1.13): "Perfil" del cliente y "Ajustes" del coach con nombre, idioma (guardado en la cuenta), kilos o libras, cambiar la contraseña, textos legales y cerrar sesión.
- **Espacios** (PR 1.14): selector `/select` para quien tiene varios y "Mis espacios" en el perfil y en los ajustes (cambiar, añadir un coach con código, crear el negocio).
- **Marca** (PR 1.15 y 1.16): el dueño cambia en Ajustes el nombre, el logo, los colores (paleta de 12 o uno propio) y el modo, con vista previa. Se guarda con `update_brand`, que valida cada dato (D-067); el logo va en Storage, en la carpeta del negocio, y solo su dueño puede tocarlo.
- **Ejercicios, solo en la base de datos** (PR 2.1): `exercise_library` (catálogo de la plataforma) y `exercises` (los de cada negocio; el coach lee, crea y edita, nadie borra, tope de 1.000 sin archivar). Cada negocio nuevo recibe la copia del catálogo. Valores de las listas, en D-089.
- **Los 120 ejercicios de la plataforma** (PR 2.2): cargados en el catálogo desde `docs/referencia/biblioteca-ejercicios.md`, sin instrucciones ni vídeos. Iron Lab y Norte Strength tienen ya sus 120. Para repartir ampliaciones futuras, `copy_exercise_library_to_all_tenants()` (D-090).
- **Módulo `exercises`** (PR 2.3): "Ejercicios" en el menú del coach. Lista por orden alfabético (los del catálogo, en el idioma de la app), pestañas "Activos" y "Archivados" con su número, buscador sin tildes y filtros de grupo, material y origen, todo en la app (D-091). Crear y editar (PR 2.4a): "Nuevo ejercicio", pulsar una fila o "Crear «lo escrito»" desde el buscador; panel en escritorio, pantalla entera en el móvil (D-092). Archivar, recuperar, duplicar y "Restaurar original" (PR 2.4b) en el panel del ejercicio; nunca se borra (D-093).
- **Módulo `programs`** (PR 2.7): "Rutinas" en el menú del coach. Lista de plantillas con "Semanal" o "Ciclo de N días" y sus días de entreno, pestañas "Activas" y "Archivadas", buscador, "Nueva plantilla" (nombre y días del ciclo), renombrar, archivar y recuperar (D-097). El documento de una rutina (esquema Zod del editor) está en `model/program-document.ts`. El editor (PR 2.8a, `/coach/programs/<id>`): los días del ciclo del primer bloque, de entreno o de descanso, con nombre, subtítulo y lugar, y "Guardar cambios" de una vez (D-098). Con cambios sin guardar, avisa al salir y los guarda en el dispositivo para "Recuperar" al volver; se borran al cerrar sesión (PR 2.8b, D-099). Cada día de entreno tiene sus ejercicios en orden: añadir con el buscador de "Ejercicios" sin salir, crear uno nuevo, subir, bajar y quitar (PR 2.9a, D-100); sustituir por otro que se mide igual, nota para el cliente y etiqueta "Archivado" (PR 2.9b, D-101). En cada ejercicio se escribe lo prescrito: series, repeticiones, intensidad y descanso, con el resumen "3 × 8-12 · RIR 1 · 2:00" (PR 2.10a, D-102), y la carga en kg o lb. El dueño elige en Ajustes → "Entrenamiento" si trabaja con RIR o con RPE (PR 2.10b, D-103). Se puede duplicar un ejercicio, un día o una plantilla entera, y copiar y pegar entre rutinas (PR 2.11, D-104).
- **Rutinas en la base de datos** (PR 2.5a y 2.5b): `programs` (sin cliente = plantilla), `program_blocks`, `program_days`, `program_day_exercises` y `program_sets`. Desde la app solo se leen: el coach, las de su negocio; el cliente, las suyas y los ejercicios que llevan. Se escriben con funciones: `save_program` guarda una rutina entera o nada (PR 2.6, D-096) y `set_program_archived` archiva y recupera plantillas. El seed trae tres plantillas: "Casa + Gym" y "Pecho / Espalda y Brazo / Pierna" en Iron Lab, y "Fuerza básica" en Norte Strength.
- **Base de datos local** (Supabase en Docker): 16 migraciones en `supabase/migrations/` (tablas, funciones de negocio, permisos, RLS, el espacio de logos, los ejercicios, las rutinas y los flags de cada módulo); 399 tests pgTAP (`npm run db:test`); 2 coaches y 6 clientes inventados (`supabase/seed.sql`, contraseña `password123`); tipos generados en `core/supabase/database.types.ts`.
- **Tests:** 600 unitarios (`npm run check`) y 91 de extremo a extremo contra Supabase local (`npm run test:e2e`).
- **Staging** (PR 1.17): proyecto `athlete-core-staging` de Supabase (Fráncfort, plan gratuito) con las mismas tablas y datos inventados que en local. Los emails salen de verdad, por Resend, desde `no-reply@athlete-core.com`. Se prueba con `npm run dev:staging` (hace falta `.env.staging.local`; guía en `supabase/README.md`). Todavía no hay web publicada.
- **Módulo `_template`** para copiar (`npm run new:module <nombre>`). Solo se registra en desarrollo.
- **Reglas que se comprueban solas:** ESLint con las fronteras de ARQUITECTURA §6, hooks de Git (formato, mensaje de commit, no subir `main`), CI con `npm run check`, y tests que vigilan las fronteras, los textos en dos idiomas y la forma fija de los módulos.

## Qué falta (lo próximo)

- De la Fase 2: el lote 5: los bloques y remates (PR 2.16 a 2.18). Publicar la web (P-03) sigue pendiente.
- Las guardas por sesión y por rol son comodidad, no seguridad: los datos los protege el RLS.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md`.

- 2026-11-17 — PR 2.18: los inicios con rutinas: avisos para el coach y "Hoy toca" para el cliente (D-114). Cierra la Fase 2.
- 2026-11-17 — PR 2.17: superseries y circuitos, en el editor y para el cliente (D-113).
- 2026-11-17 — PR 2.16: varios bloques en una rutina, en el editor y para el cliente (D-112).
- 2026-11-16 — Lote 4 de la Fase 2 fusionado en `main` (#43 a #48) con el visto bueno del propietario tras probarlo en la app: asignar rutinas a clientes, ficha y vista del cliente en "Entreno".
- 2026-11-16 — PR 2.15: "Entreno" para el cliente: hoy toca, los días, cada día y cada ejercicio, en lectura (D-111). Cierra el lote 4.

## A tener en cuenta ahora

- El proyecto vive en `C:\dev\athlete-core`, **fuera de OneDrive** (sincronizar `node_modules` da errores).
- Se usa **TypeScript 6**, no 7: el lint de TypeScript aún no admite la 7 (DECISIONES D-022).
- `main` no está protegida en GitHub: hace falta GitHub Pro (GUIA-GIT §12).
- Un agente puede fusionar PR, pero solo con el visto bueno expreso del propietario para ese lote (D-068).
- Supabase en plan gratuito (D-063): la sesión de 30 días la controla la propia app, y no hay copias de seguridad recuperables. Resend gratuito: 100 emails al día.
- **Si staging deja de responder** (la app contra staging no carga o no llegan emails), lo más probable es que Supabase lo haya pausado por pasar una semana sin uso: es normal en el plan gratuito. Se reanuda en el panel de Supabase con **Restore project**, tarda un par de minutos y no se pierde nada (`supabase/README.md`, paso 6).
- El proyecto de staging de Supabase está conectado al repositorio de GitHub (comprobación "Supabase Preview", siempre omitida). No hace nada; se quita en el panel, Settings → Integrations.
- El dominio es `athlete-core.com`, en Cloudflare. Antes del primer usuario real hacen falta los textos legales definitivos (D-060) y revisar el plan de Supabase (D-063).
- El identificador de la app móvil (`app.athletecore.mobile`) es provisional: hay que fijarlo antes de publicar en las tiendas.

## Para saber más

| Necesito… | Archivo |
|---|---|
| Las reglas y normas de código | `AGENTS.md` |
| Saber dónde va cada cosa | `docs/ARQUITECTURA.md` |
| Hacer un cambio con Git | `docs/GUIA-GIT.md` |
| El estado detallado y las fases | `docs/ESTADO.md` |
| El porqué de una decisión | `docs/DECISIONES.md` |
| Una plantilla de prompt | `docs/PROMPTS.md` |
