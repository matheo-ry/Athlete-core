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

- **Fase actual:** 1 — Cuentas, negocio del coach y unirse con código.
- **Última tarea terminada:** PR 1.16 — Marca: logo (2026-11-14), rama `feat/logo-del-coach`.
- **En curso:** PR abiertos y apilados, esperando revisión del propietario (D-064). La lista, en `docs/ESTADO.md`.
- **Siguiente tarea:** Fase 1, PR 1.17 — Staging y emails reales. Está preparado en borrador (rama `chore/staging`): falta seguir con el propietario la guía de `supabase/README.md`. Antes, él necesita el dominio (P-01) y las cuentas de Supabase y Resend. Los 16 PR de la fase (1.2 a 1.17) están en orden, con sus criterios de aceptación, en `docs/PROMPTS.md` §5.

## Cómo funcionará la Fase 1 (ya decidido)

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
- **Base de datos local** (Supabase en Docker): 7 migraciones en `supabase/migrations/` (tablas, funciones de negocio, permisos, RLS y el espacio de logos); 150 tests pgTAP (`npm run db:test`); 2 coaches y 6 clientes inventados (`supabase/seed.sql`, contraseña `password123`); tipos generados en `core/supabase/database.types.ts`.
- **Tests:** 374 unitarios (`npm run check`) y 43 de extremo a extremo contra Supabase local (`npm run test:e2e`).
- **Módulo `_template`** para copiar (`npm run new:module <nombre>`). Solo se registra en desarrollo.
- **Reglas que se comprueban solas:** ESLint con las fronteras de ARQUITECTURA §6, hooks de Git (formato, mensaje de commit, no subir `main`), CI con `npm run check`, y tests que vigilan las fronteras, los textos en dos idiomas y la forma fija de los módulos.

## Qué falta (lo próximo)

- **Staging y emails reales** (PR 1.17): la guía está escrita; se sigue con el propietario cuando tenga el dominio (P-01) y las cuentas de Supabase y Resend.
- Las guardas por sesión y por rol son comodidad, no seguridad: los datos los protege el RLS.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md`.

- 2026-11-14 — PR 1.16: el logo del coach, en Storage, visible en toda la app.
- 2026-11-14 — PR 1.15: la marca del coach (nombre, colores y modo, con vista previa); `update_brand` (D-067).
- 2026-11-14 — PR 1.14: selector de espacio y "Mis espacios"; el último espacio se recuerda hasta cerrar sesión (D-066).
- 2026-11-14 — PR 1.13: perfil y cuenta; "Cerrar sesión" pasa al perfil y a los ajustes.
- 2026-11-14 — PR 1.12: crear negocio y primeros pasos del coach.

## A tener en cuenta ahora

- El proyecto vive en `C:\dev\athlete-core`, **fuera de OneDrive** (sincronizar `node_modules` da errores).
- Se usa **TypeScript 6**, no 7: el lint de TypeScript aún no admite la 7 (DECISIONES D-022).
- `main` no está protegida en GitHub: hace falta GitHub Pro (GUIA-GIT §12).
- La Fase 1 se lleva entera desde un mismo chat, con una rama y un PR por tarea (D-036).
- Supabase en plan gratuito (D-063): la sesión de 30 días la controla la propia app, y no hay copias de seguridad recuperables.
- Hace falta el dominio (P-01) antes del PR 1.17. Antes del primer usuario real hacen falta los textos legales definitivos (D-060) y revisar el plan de Supabase (D-063).
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
