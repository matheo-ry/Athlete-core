# core/auth

Sesión, entrar y guardas de ruta (DECISIONES D-041 a D-045, D-056 y D-061).

- **`AuthService`** (`auth-types.ts`): lo que la app necesita de las cuentas. La implementación real está en `api/supabase-auth-service.ts`, el único archivo que habla con Supabase Auth. Los tests usan una falsa: `src/test/fake-auth-service.ts`.
- **`AuthProvider` y `useAuth()`**: estado de la sesión (`loading`, `signed-in`, `signed-out`) y por qué se cerró (`explicit` o `expired`). La sesión se guarda en el dispositivo y se mantiene al recargar.
- **30 días sin abrir la app** (`inactivity.ts`): al arrancar, si han pasado más de 30 días, se cierra la sesión (D-045). Lo hace la app porque el cierre por inactividad de Supabase es de pago (D-063). Es comodidad, no seguridad.
- **Guardas**: `RequireAuth` (sin sesión, a `/login?next=…`) y `RequireGuest` (con sesión, fuera de las pantallas de entrar). `next-path.ts` solo acepta rutas de la propia app, para que un enlace no pueda llevar a otra web.
- **Mensajes**: `failureMessageKey(reason)` da la clave de texto de cada fallo. Para distinguir "no existe" de "contraseña mala" se pregunta a la función `email_status` de la base de datos (D-043).
- **Qué no va aquí:** las pantallas (están en `app/public/`) y los datos del tenant (`core/tenancy`).
