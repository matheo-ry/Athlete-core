-- =====================================================================
-- Datos inventados para desarrollo en local (ARQUITECTURA §4).
-- Se cargan solos con "npm run db:reset". Nunca datos reales.
--
-- 2 coaches y 5 clientes:
--   * Iron Lab (coach.iron@example.com), código IRONLAB1:
--     clientes ana, bruno y carla.
--   * Norte Strength (coach.norte@example.com), código NORTE001:
--     clientes diego y elena.
--
-- Todos entran con la contraseña "password123". Solo existe en la base de
-- datos local: no es un secreto.
--
-- Los negocios se crean con las mismas funciones que usará la app
-- (create_tenant, join_tenant_with_code): así el seed también las prueba.
-- =====================================================================

-- Usuarios. Supabase Auth necesita la fila de auth.users y su identidad de
-- email para poder entrar con contraseña.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'coach.iron@example.com'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'coach.norte@example.com'),
  ('20000000-0000-4000-8000-000000000001'::uuid, 'ana@example.com'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'bruno@example.com'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'carla@example.com'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'diego@example.com'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'elena@example.com')
) as u (id, email);

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@example.com';

-- Perfiles: los crea el trigger al dar de alta el usuario; aquí se rellenan.
update public.profiles p
set display_name = v.display_name, locale = v.locale, weight_unit = v.weight_unit
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'Iris Hierro',     'en', 'lb'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'Nora Norte',      'es', 'kg'),
  ('20000000-0000-4000-8000-000000000001'::uuid, 'Ana Ejemplo',     'es', 'kg'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'Bruno Prueba',    'en', 'lb'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'Carla Demo',      'es', 'kg'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'Diego Ficticio',  'es', 'kg'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'Elena Inventada', 'en', 'kg')
) as v (user_id, display_name, locale, weight_unit)
where p.user_id = v.user_id;

-- Negocios y clientes, actuando como cada usuario.
do $$
declare
  v_iron  uuid;
  v_norte uuid;
  v_user  uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001"}', true);
  v_iron := public.create_tenant('Iron Lab');
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002"}', true);
  v_norte := public.create_tenant('Norte Strength');

  -- La misma marca que los datos de ejemplo de la Fase 0 (core/tenancy).
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Iron Lab', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#DC2626', 'accent', '#F59E0B'), 'mode', 'dark'
  ) where id = v_iron;
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Norte Strength', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#0F766E', 'accent', '#B45309'), 'mode', 'light'
  ) where id = v_norte;

  -- Códigos fijos, para poder escribirlos a mano en local.
  update public.tenant_invites set code = 'IRONLAB1' where tenant_id = v_iron;
  update public.tenant_invites set code = 'NORTE001' where tenant_id = v_norte;

  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('IRONLAB1');
  end loop;

  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000005'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('NORTE001');
  end loop;

  perform set_config('request.jwt.claims', '', true);
end
$$;
