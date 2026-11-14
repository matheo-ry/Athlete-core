# src/app/public

Pantallas de entrada, fuera de las zonas de coach y de cliente: entrar (`/login`), bienvenida (`/welcome`), unirse con código (`/join`) y la página 404.

- **Qué va aquí:** pantallas que se ven antes de pertenecer a un tenant.
- **Qué falta (Fase 1):** `/start`, `/signup`, `/verify`, `/reset-password` y la lógica real de crear negocio y unirse con código (ver `docs/PROMPTS.md` §5).
- **Qué no va aquí:** nada que necesite datos de un tenant, ni llamadas a Supabase (eso va en `core/auth/api/`).
