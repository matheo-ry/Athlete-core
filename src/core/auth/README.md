# core/auth

Sesión, entrar, guardas de ruta y el perfil de la cuenta (DECISIONES D-041 a D-045, D-056, D-058 y D-061).

- **`AuthService`** (`auth-types.ts`): lo que la app necesita de las cuentas. La implementación real está en `api/supabase-auth-service.ts`, el único archivo que habla con Supabase Auth. Los tests usan una falsa: `src/test/fake-auth-service.ts`.
- **`AuthProvider` y `useAuth()`**: estado de la sesión (`loading`, `signed-in`, `signed-out`) y por qué se cerró (`explicit` o `expired`). La sesión se guarda en el dispositivo y se mantiene al recargar.
- **30 días sin abrir la app** (`inactivity.ts`): al arrancar, si han pasado más de 30 días, se cierra la sesión (D-045). Lo hace la app porque el cierre por inactividad de Supabase es de pago (D-063). Es comodidad, no seguridad.
- **Abrir la app sin conexión** (`offline-session.ts`, D-118): si el token ha caducado y no hay conexión para renovarlo, Supabase arranca sin sesión pero la deja guardada; mientras siga guardada, la app entra con ella para enseñar lo que hay en el teléfono. No da acceso a nada: sin un token válido la base de datos no responde, y al volver la conexión Supabase la renueva o la cierra.
- **Guardas**: `RequireAuth` (sin sesión, a `/login?next=…`) y `RequireGuest` (con sesión, fuera de las pantallas de entrar). `next-path.ts` solo acepta rutas de la propia app, para que un enlace no pueda llevar a otra web.
- **Códigos por email** (D-038, D-039 y D-042): entrar sin contraseña, recuperar la contraseña y, desde el PR 1.7, confirmar el email. Antes de mandar un código se comprueba que el email tiene cuenta. `useResendTimer` lleva la cuenta atrás de 60 segundos de "Enviar otro código".
- **Cambiar la contraseña** cierra las sesiones de los demás dispositivos (D-042). Pide la actual, salvo a quien entró con un código por email (`useNeedsCurrentPassword` lo sabe por el método con el que se entró en esta sesión).
- **Perfil** (`profile.ts`, `useProfile.ts`, D-058): nombre, idioma y unidad de peso de la cuenta. `useUpdateProfile` cambia la pantalla al momento y, si no se puede guardar, vuelve a como estaba. El idioma y el nombre se guardan también en los datos de la cuenta de Supabase Auth, que es lo que leen las plantillas de los emails (D-044).
- **`ProfileLanguageSync`** (dentro de `AuthProvider`, en `app/providers.tsx`): al entrar, también en otro dispositivo, la app se pone en el idioma de la cuenta; con la sesión abierta, cambiar el idioma (en el perfil o con el selector) se guarda en la cuenta.
- **Registro** (`signup.ts`, D-040 y D-060): nombre de 2 a 60 caracteres, versión de los términos (`TERMS_VERSION`) y `completeSignup`, que tras confirmar el email guarda otra vez la última contraseña y los datos del formulario (D-043). `pending-signup.ts` recuerda el registro entre "Crear cuenta" y "Confirmar": la contraseña, solo en memoria; el email, en el dispositivo durante un día.
- **`useAuthAction`**: envuelve cada acción de cuenta. Sin conexión no se intenta, y un error inesperado se convierte en un mensaje, sin romper la pantalla (D-061).
- **Mensajes**: `failureMessageKey(reason)` da la clave de texto de cada fallo. Para distinguir "no existe" de "contraseña mala" se pregunta a la función `email_status` de la base de datos (D-043).
- **Qué no va aquí:** las pantallas (están en `app/public/`) y los datos del tenant (`core/tenancy`).
