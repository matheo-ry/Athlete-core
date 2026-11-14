# src/app/public

Pantallas de entrada, fuera de las zonas de coach y de cliente: la primera pantalla (`/start`, con el código del coach en primer plano, D-037), unirse con código o con enlace (`/join?code=…`, con la vista previa del coach pintada con su marca), entrar (`/login`), entrar con un código por email (`/login/code`), crear la cuenta (`/signup`), confirmar el email (`/verify`), recuperar la contraseña (`/reset-password`), textos legales (`/legal/terms` y `/legal/privacy`, en borrador), bienvenida (`/welcome`), crear negocio (`/create-business`), las condiciones para coaches (`/legal/coach-terms`, en borrador) y la página 404.

- **Registro** (D-040, D-043 y D-060): el formulario vive en `useSignupForm.ts`. Al confirmar el email, `VerifyEmailPage` vuelve a guardar la contraseña recién escrita y los datos del formulario: así vale siempre la última, aunque otra persona hubiera registrado antes ese email. Si se cerró la app entre medias, pide elegir una contraseña.

- **Qué va aquí:** pantallas que se ven antes de pertenecer a un tenant.
- **Piezas comunes de las pantallas de cuenta:** `EmailStep` (escribir el email y mandar el código), `CodeStep` (escribir el código de 6 dígitos, con "Enviar otro código" a los 60 segundos), `NewPasswordStep` y `FailureMessage` (el mensaje de un fallo, con la salida que toca resaltada, D-043). El email escrito pasa de una pantalla a otra en el estado de la navegación (`auth-navigation.ts`), no en la dirección.
- **Unirse** (D-051 y D-054): `JoinCodeView` pide la vista previa una sola vez por código (un código equivocado pedido dos veces contaría dos intentos) y da un mensaje para cada caso (`join-messages.ts`).
- **Unirse al crear la cuenta** (D-037): "Crear cuenta" y "Ya tengo cuenta" recuerdan el código y vuelven a `/join` al terminar, donde el alta se hace sola. `PendingInviteBrand` pinta las pantallas de cuenta con la marca de ese coach.
- **Crear negocio** (D-049): solo el nombre (2 a 40 caracteres) y aceptar las condiciones para coaches. "¿Eres coach?" en `/start` recuerda la intención y lleva al registro; al confirmar el email se llega aquí. Quien ya es dueño de un negocio va a su zona.
- **Qué no va aquí:** nada que necesite datos de un tenant, ni llamadas a Supabase (eso va en `core/auth/api/`).
