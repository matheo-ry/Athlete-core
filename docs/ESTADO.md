# ESTADO DEL PROYECTO

**Última actualización:** 2026-11-12
**Fase actual:** 0 — Esqueleto

Este archivo lo actualiza quien termina una tarea, en el mismo Pull Request, junto con `CONTEXTO.md` (que resume este en una página).

## En curso

- (nada todavía)

## Siguiente

- Fase 0 completa. El prompt está en `EMPEZAR-AQUI.md`.

## Fases

### Fase 0 — Esqueleto (sin funciones de producto)

- [ ] Proyecto base (Vite + React + TypeScript estricto)
- [ ] Estructura de carpetas de ARQUITECTURA §4 y §5
- [ ] ESLint con fronteras, Prettier, Husky, lint-staged, commitlint
- [ ] Comandos de npm de ARQUITECTURA §13
- [ ] `core/` mínimo: config, i18n, ui, branding, lib, modules, flags y tenancy (con datos de ejemplo)
- [ ] Carcasas de coach y de cliente, con selector de perfil solo en desarrollo
- [ ] Módulo `_template` y `npm run new:module`
- [ ] Tests configurados (Vitest y Playwright) con ejemplos reales
- [ ] `supabase init` (sin tablas) y Capacitor configurado (sin plataformas)
- [ ] CI en GitHub Actions
- [ ] Versiones anotadas en DECISIONES.md

### Fase 1 — Cuentas, negocio del coach y unirse con código

- [ ] Supabase local y primera migración a partir de `docs/referencia/esquema-base.sql`
- [ ] Tests de aislamiento (RLS) y comprobación en el CI
- [ ] Decidir cómo se entra y si se confirma el email (DECISIONES, P-09)
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

- Falta decidir el nombre de la app (DECISIONES, P-01).

## Ideas y deuda

Cosas que alguien ha visto y que no tocaban en su tarea. No se hacen sin convertirlas antes en tarea.

- Limitar los intentos fallidos al escribir un código de invitación (por usuario).
- Que el coach pueda apagar desde sus ajustes las funciones que no use (ARQUITECTURA §9).
- Alta de un segundo coach (`staff`) en el mismo negocio.

## Registro de cambios

Lo más nuevo, arriba.

- 2026-11-12 — Añadido `CONTEXTO.md` (resumen para cada chat nuevo) y la forma de trabajar con chats (`EMPEZAR-AQUI.md` Parte 3, `docs/PROMPTS.md` §0).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git y esquema base de referencia.
