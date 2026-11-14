# Módulo `clients`

- **Qué hace:** los clientes del coach (DECISIONES D-059). En `/coach/clients`: pestañas "Activos" y "Dados de baja", buscador por nombre, plazas del plan ("2 de 3 plazas") con aviso de plan lleno, y la tarjeta del código de invitación (verlo, copiarlo, compartir el enlace y, solo el dueño, regenerarlo).
- **El cliente no ve nada de este módulo:** no tiene pantallas de cliente.
- **Datos:** no tiene tablas propias. Usa `tenant_members`, `profiles`, `tenant_invites` y `tenants` a través de los hooks de `core/tenancy` (`useTenantMembers`, `useInviteCode`, `useRegenerateInviteCode`, `usePlanLimit`). La lista de miembros vive en `core/tenancy` para que ningún otro módulo tenga que depender de este (ARQUITECTURA §6). Por eso `api/` está vacía.
- **No se ve el email** de los clientes (D-059).
- **Flag:** `clients` (tipo core, activo para todos), añadido en la migración `20261114140000_clients_feature.sql`.
- **Estado:** lista y código (PR 1.10). La ficha del cliente, darlo de baja y reactivarlo llegan en el PR 1.11. Las pestañas de rutinas y progreso de la ficha las aportarán esos módulos (Fases 2 y 3).
