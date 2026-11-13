# ESTADO DEL PROYECTO

**Última actualización:** 2026-11-13
**Fase actual:** 1 — Cuentas, negocio del coach y unirse con código (la Fase 0 terminó y se fusionó el 2026-11-13)

Este archivo lo actualiza quien termina una tarea, en el mismo Pull Request, junto con `CONTEXTO.md` (que resume este en una página).

## En curso

- PR 1.1 — Base de datos (rama `db/esquema-base`, PR 3).

## Siguiente

1. Fase 1, PR 1.2 — Registro y login. El prompt está en `docs/PROMPTS.md` §5.

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

- [x] Supabase local y primera migración a partir de `docs/referencia/esquema-base.sql` (PR 1.1, pendiente de fusionar)
- [x] Tests de aislamiento (RLS) y comprobación en el CI (PR 1.1: 53 tests pgTAP; las tablas y funciones nuevas nacen sin permisos, D-032)
- [x] Decidir cómo se entra: contraseña y enlace por email (DECISIONES D-035). Falta confirmar si se exige verificar el email
- [ ] Registro, login y recuperar contraseña
- [ ] Pantalla de bienvenida: "Soy coach" / "Tengo un código"
- [ ] Crear negocio, ver y regenerar el código de invitación
- [ ] Unirse con código o con enlace, con vista previa del coach
- [ ] Guardas de ruta por rol y selector de tenant
- [ ] Marca del coach: nombre, logo y colores aplicados al tema (el logo, en Storage con permisos por tenant)
- [ ] Perfil del usuario: nombre, idioma y unidad de peso
- [ ] Módulo `clients`: lista de clientes y archivar

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
- [ ] Textos legales: privacidad, términos y reembolsos
- [ ] Cuentas de desarrollador de Apple y de Google (comprobar los requisitos de prueba previa de Google Play y empezar pronto)
- [ ] 3–5 coaches piloto usando la app

### Fase 5 — Planes y pagos

- [ ] Suscripción del coach y límites por plan
- [ ] Cobros del coach a sus clientes

## Bloqueos y dudas abiertas

- Falta el dominio de la web (DECISIONES, P-01).
- Antes del PR 1.2 hay que confirmar dos puntos de D-035: si se exige verificar el email y si "elegir entrenador" incluye una lista pública de coaches.
- Proteger `main` (GUIA-GIT §12) no es posible todavía: en un repositorio privado GitHub lo exige de pago (GitHub Pro, gratis con el Student Developer Pack). Mientras tanto protege el hook local que bloquea subir a `main`. Ya está activo: solo "Squash merge" y borrar la rama al fusionar.

## Ideas y deuda

Cosas que alguien ha visto y que no tocaban en su tarea. No se hacen sin convertirlas antes en tarea.

- Limitar los intentos fallidos al escribir un código de invitación (por usuario).
- Que el coach pueda apagar desde sus ajustes las funciones que no use (ARQUITECTURA §9).
- Alta de un segundo coach (`staff`) en el mismo negocio.
- Pasar a TypeScript 7 cuando el lint de TypeScript lo admita (DECISIONES D-022).
- Detectar con lint los textos escritos directamente en un componente (AGENTS.md, regla 7). Hoy se revisa a mano. Haría falta una librería nueva.
- Añadir reglas de accesibilidad al lint (etiquetas, botones de verdad). Haría falta una librería nueva.
- Test de fronteras: añadir el caso permitido de la tabla de dependencias entre módulos cuando existan dos módulos reales (`programs` → `exercises`).
- Zod ocupa buena parte del peso de la app. Si el tamaño llega a importar, valorar su variante ligera.
- Recordar la última elección del selector de desarrollo al recargar la página (hoy vuelve al primer coach de ejemplo).
- Un test pgTAP que pruebe cada política de UPDATE por separado. Hoy, si se afloja `members_update`, la política de lectura sigue bloqueando (Postgres la aplica en los UPDATE con WHERE) y los tests no lo notan. No es un agujero, pero la segunda capa no está vigilada.
- Los casos 15 a 19 y 28 de `docs/referencia/pruebas-aislamiento.sql` se escriben con la primera tabla de negocio (`programs`, Fase 2).

## Registro de cambios

Lo más nuevo, arriba.

- 2026-11-13 — PR 1.1 (base de datos): Supabase local con los comandos `db:*`, primera migración desde `esquema-base.sql` con privilegios por defecto cerrados (D-032), 53 tests pgTAP, seed con 2 coaches y 5 clientes, tipos generados y job "Base de datos" en el CI.
- 2026-11-13 — Fase 0 terminada: proyecto base, estructura de carpetas, calidad (ESLint con fronteras, Prettier, hooks de Git), `core/` mínimo con datos de ejemplo, carcasas de coach y de cliente, módulo `_template`, tests (Vitest y Playwright), `supabase init`, Capacitor y CI. Versiones y decisiones en `docs/DECISIONES.md` (D-021 a D-031).
- 2026-11-12 — Nombre de la app decidido: ATHLETE CORE (DECISIONES D-021).

- 2026-11-12 — Añadido `CONTEXTO.md` (resumen para cada chat nuevo) y la forma de trabajar con chats (`EMPEZAR-AQUI.md` Parte 3, `docs/PROMPTS.md` §0).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git y esquema base de referencia.
