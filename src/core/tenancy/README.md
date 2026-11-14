# core/tenancy

Tenant activo, rol del usuario y perfil (coach, cliente o todavía sin espacio), sacados de la sesión y de la base de datos (DECISIONES D-048 y D-056).

- `membership.ts`: los **espacios** del usuario (cada negocio al que pertenece, con su rol y su estado), cómo se elige en cuál se entra y adónde lleva cada uno (`homePathFor`). Lógica pura, con tests.
- `api/supabase-tenancy-source.ts`: lee `tenant_members` con su negocio. El RLS solo deja ver las filas propias, y el negocio solo si el usuario es miembro activo: un espacio dado de baja llega sin negocio.
- `TenancyProvider`: pide los espacios al entrar y cada vez que se vuelve a la app (así nota si el coach ha dado de baja al usuario, D-061). Mientras carga, se ve un indicador de carga; si falla, un error con "Reintentar". Al cerrar sesión borra de memoria los datos del usuario.
- `RequireProfile`: guarda por rol. `/coach` solo con espacio de coach, `/client` solo con espacio de cliente y `/welcome` solo sin espacio.
- `useTenancy()` da el espacio activo; `useTenancyContext()` da además la lista y `selectTenant` (para el selector del PR 1.14).
- Con varios espacios y sin elección, se entra en el de coach y, si no hay, en el más antiguo. El selector llega en el PR 1.14.
