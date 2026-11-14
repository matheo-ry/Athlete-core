# core/flags

Qué funciones están activas para el tenant: `useFeature('clave')` y `<FeatureGate>`. No es seguridad: eso lo hace RLS.

- Los flags se leen de la vista `tenant_effective_features` del espacio activo (`api/supabase-flags-source.ts`), que aplica las reglas de ARQUITECTURA §9. Sin espacio no hay ninguno activo.
- Nunca oculta las pantallas mientras carga: lo dice en `status` (`loading`, `ready`, `error`). Esperan las zonas de coach y de cliente (`app/RequireFlags.tsx`), con un indicador de carga o un error con "Reintentar".
- Las rutas de cada módulo existen siempre y `app/ModuleGate.tsx` las abre o no según su flag. Así el router se crea una sola vez y no pierde la navegación cuando cambian los flags.
- Los módulos de ejemplo (`_template`) se montan siempre en desarrollo, sin flag en la base de datos (`developmentModuleKeys` en `src/modules/index.ts`).
- Para tests de un componente suelto: `StaticFlagsProvider`, con una lista fija de flags.
