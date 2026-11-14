# src/app/public

Pantallas de entrada, fuera de las zonas de coach y de cliente: entrar (`/login`), entrar con un código por email (`/login/code`), crear la cuenta (`/signup`), confirmar el email (`/verify`), recuperar la contraseña (`/reset-password`), textos legales (`/legal/terms` y `/legal/privacy`, en borrador), bienvenida (`/welcome`), unirse con código (`/join`) y la página 404.

- **Registro** (D-040, D-043 y D-060): el formulario vive en `useSignupForm.ts`. Al confirmar el email, `VerifyEmailPage` vuelve a guardar la contraseña recién escrita y los datos del formulario: así vale siempre la última, aunque otra persona hubiera registrado antes ese email. Si se cerró la app entre medias, pide elegir una contraseña.

- **Qué va aquí:** pantallas que se ven antes de pertenecer a un tenant.
- **Piezas comunes de las pantallas de cuenta:** `EmailStep` (escribir el email y mandar el código), `CodeStep` (escribir el código de 6 dígitos, con "Enviar otro código" a los 60 segundos), `NewPasswordStep` y `FailureMessage` (el mensaje de un fallo, con la salida que toca resaltada, D-043). El email escrito pasa de una pantalla a otra en el estado de la navegación (`auth-navigation.ts`), no en la dirección.
- **Qué falta (Fase 1):** `/start` y la lógica real de crear negocio y unirse con código (ver `docs/PROMPTS.md` §5).
- **Qué no va aquí:** nada que necesite datos de un tenant, ni llamadas a Supabase (eso va en `core/auth/api/`).
