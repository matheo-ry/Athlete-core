# core/native

Envoltorio de las funciones del dispositivo. Es el único sitio que importará `@capacitor/*` (desde la Fase 4: notificaciones, cámara, salud).

- `share.ts`: compartir un enlace (menú de compartir del dispositivo) o copiarlo. Hoy con las funciones del navegador; si en la app de móvil hace falta el plugin de Capacitor, se conecta aquí sin tocar a quien lo usa.
