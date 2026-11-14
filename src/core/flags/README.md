# core/flags

Qué funciones están activas para el tenant: `useFeature('clave')` y `<FeatureGate>`. No es seguridad: eso lo hace RLS.

- Los flags se leen de la vista `tenant_effective_features` del espacio activo (`api/supabase-flags-source.ts`), que aplica las reglas de ARQUITECTURA §9. Sin espacio no hay ninguno activo.
- Mientras cargan se ve un indicador de carga; si fallan, un error con "Reintentar".
- Los módulos de ejemplo (`_template`) se montan siempre en desarrollo, sin flag en la base de datos (`developmentModuleKeys` en `src/modules/index.ts`).
- Para tests de un componente suelto: `StaticFlagsProvider`, con una lista fija de flags.
