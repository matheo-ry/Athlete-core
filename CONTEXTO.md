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

- **Fase actual:** 0 — Esqueleto: **terminada**, pendiente de fusionar su Pull Request (rama `chore/fase-0-esqueleto`).
- **Última tarea terminada:** Fase 0 completa (2026-11-13).
- **En curso:** —
- **Siguiente tarea:** Fase 1, PR 1.1 — Base de datos (prompt en `docs/PROMPTS.md` §5). Antes: fusionar el PR de la Fase 0, proteger `main` e instalar Docker Desktop.

## Qué existe ya

- **La app arranca** (`npm install`, `npm run dev`) con datos de ejemplo: zona de coach (`/coach`), zona de cliente (`/client`), bienvenida (`/welcome`), unirse con código (`/join`, solo la pantalla) y 404. Inglés y español.
- **`core/` mínimo:** variables de entorno validadas, i18n, componentes base, marca → variables de tema (con corrección de contraste), unidades kg/lb, fechas, logger, `defineModule`, flags y tenancy **con datos de ejemplo**, y el cliente de Supabase (sin usar todavía).
- **Módulo `_template`** para copiar (`npm run new:module <nombre>`). Solo se registra en desarrollo.
- **Reglas que se comprueban solas:** ESLint con las fronteras de ARQUITECTURA §6, hooks de Git (formato, mensaje de commit, no subir `main`), CI con `npm run check`, y tests que vigilan las fronteras, los textos en dos idiomas y la forma fija de los módulos.

## Qué falta (lo próximo)

- **No hay base de datos, ni login, ni datos reales.** Todo eso es la Fase 1.
- Al llegar los datos reales desaparecen `core/tenancy/sample-tenancy.ts` y `core/flags/sample-flags.ts`, y las variables de Supabase pasan a ser obligatorias.
- Sin guardas de ruta por rol todavía: separar `/coach` y `/client` es comodidad, no seguridad.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md`.

- 2026-11-13 — Fase 0: esqueleto completo de la app (proyecto base, `core/` mínimo, carcasas, `_template`, calidad, tests, CI).
- 2026-11-12 — Nombre decidido: ATHLETE CORE (DECISIONES D-021).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git, esquema base de la base de datos y este archivo.

## A tener en cuenta ahora

- El proyecto vive en `C:\dev\athlete-core`, **fuera de OneDrive** (sincronizar `node_modules` da errores).
- Se usa **TypeScript 6**, no 7: el lint de TypeScript aún no admite la 7 (DECISIONES D-022).
- El PR 2 pone el nombre en `AGENTS.md` y `docs/ARQUITECTURA.md` y activa `CODEOWNERS`. `main` no está protegida en GitHub: hace falta GitHub Pro (GUIA-GIT §12).
- Antes del PR 1.2 hay que decidir cómo se entra y si se confirma el email (DECISIONES P-09).
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
