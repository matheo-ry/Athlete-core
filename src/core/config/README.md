# core/config

Variables de entorno validadas con Zod (`env`). Es el único sitio que lee `import.meta.env`.

Desde la Fase 1, `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` son obligatorias (DECISIONES D-025): sin ellas la app no arranca y el error dice qué falta. En local salen de `npx supabase status`. Los tests unitarios usan unos valores de mentira, puestos en `vite.config.ts`.

`VITE_PUBLIC_APP_URL` es opcional: la dirección pública de la web, para los enlaces de invitación (`/join?code=…`). Sin ella se usa la dirección desde la que se ve la app. Hay que ponerla cuando la web esté publicada (P-03), y en la app de móvil.
