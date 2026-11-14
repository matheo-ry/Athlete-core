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
- **Última tarea terminada:** diseño de la Fase 1 (2026-11-14), rama `docs/diseno-fase-1`: decisiones D-036 a D-063.
- **En curso:** —
- **Siguiente tarea:** Fase 1, PR 1.2 — Base de datos: cuentas y emails. Los 16 PR de la fase (1.2 a 1.17) están en orden, con sus criterios de aceptación, en `docs/PROMPTS.md` §5.

## Cómo funcionará la Fase 1 (ya decidido)

- **Primero el código, después la cuenta:** la primera pantalla (`/start`) pide el código del coach; debajo, "Ya tengo cuenta" y "Soy coach" (D-037).
- **Cuentas:** nombre, email y contraseña. El email se confirma con un código de 6 dígitos; con ese mismo sistema se entra sin contraseña y se recupera la contraseña. Los emails no llevan enlaces (D-038 a D-044).
- **Dar de baja:** el coach quita el acceso a un cliente y puede reactivarlo; nunca borra su cuenta (D-055).
- **Espacios:** una cuenta puede ser coach y cliente a la vez, y cliente de varios coaches (D-048 y D-056).

## Qué existe ya

- **La app arranca** (`npm install`, `npm run dev`) con datos de ejemplo: zona de coach (`/coach`), zona de cliente (`/client`), bienvenida (`/welcome`), unirse con código (`/join`, solo la pantalla) y 404. Inglés y español.
- **`core/` mínimo:** variables de entorno validadas, i18n, componentes base, marca → variables de tema (con corrección de contraste), unidades kg/lb, fechas, logger, `defineModule`, flags y tenancy **con datos de ejemplo**, y el cliente de Supabase (sin usar todavía).
- **Módulo `_template`** para copiar (`npm run new:module <nombre>`). Solo se registra en desarrollo.
- **Base de datos local** (Supabase en Docker): tablas base, funciones de negocio, permisos y RLS en `supabase/migrations/`; 53 tests pgTAP (`npm run db:test`); 2 coaches y 5 clientes inventados (`supabase/seed.sql`, contraseña `password123`); tipos generados en `core/supabase/database.types.ts`.
- **Reglas que se comprueban solas:** ESLint con las fronteras de ARQUITECTURA §6, hooks de Git (formato, mensaje de commit, no subir `main`), CI con `npm run check`, y tests que vigilan las fronteras, los textos en dos idiomas y la forma fija de los módulos.

## Qué falta (lo próximo)

- **No hay login ni pantallas con datos reales.** La app todavía usa los datos de ejemplo de la Fase 0; se conecta a la base de datos en los PR 1.3 y 1.4.
- Al llegar los datos reales desaparecen `core/tenancy/sample-tenancy.ts` (PR 1.4) y `core/flags/sample-flags.ts` (PR 1.5), y las variables de Supabase pasan a ser obligatorias (PR 1.3).
- Sin guardas de ruta por rol todavía: separar `/coach` y `/client` es comodidad, no seguridad.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md`.

- 2026-11-14 — Diseño de la Fase 1: decisiones D-036 a D-063, lista de los 16 PR en `docs/PROMPTS.md` §5 y ARQUITECTURA §7, §8 y §10 al día.
- 2026-11-13 — PR 1.1: base de datos local, primera migración, tests de RLS en el CI, seed y tipos.
- 2026-11-13 — Fase 0: esqueleto completo de la app (proyecto base, `core/` mínimo, carcasas, `_template`, calidad, tests, CI).
- 2026-11-12 — Nombre decidido: ATHLETE CORE (DECISIONES D-021).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git, esquema base de la base de datos y este archivo.

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
