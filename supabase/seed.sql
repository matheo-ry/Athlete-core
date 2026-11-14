-- =====================================================================
-- Datos inventados para desarrollo en local (ARQUITECTURA §4).
-- Se cargan solos con "npm run db:reset". Nunca datos reales.
--
-- 2 coaches y 6 clientes:
--   * Iron Lab (coach.iron@example.com), código IRONLAB1, plan free (3):
--     clientes ana, bruno y carla. El plan está LLENO.
--   * Norte Strength (coach.norte@example.com), código NORTE001, plan starter (10):
--     clientes diego, elena y la propia coach de Iron Lab (coach y clienta a
--     la vez, D-048). fran está DADO DE BAJA (D-055).
--
-- Todos entran con la contraseña "password123". Solo existe en la base de
-- datos local: no es un secreto.
--
-- Idioma: al entrar, la app se pone en el idioma de la cuenta (D-058). Todos
-- están en inglés, que es lo que esperan los tests de extremo a extremo, salvo
-- carla, en español, para probar a mano que la app cambia sola al entrar.
--
-- Los negocios se crean con las mismas funciones que usará la app
-- (create_tenant, join_tenant_with_code, archive_client): así el seed también
-- las prueba.
-- =====================================================================

-- Usuarios. Supabase Auth necesita la fila de auth.users y su identidad de
-- email para poder entrar con contraseña. Los datos de la cuenta
-- (raw_user_meta_data) son los mismos que envía la app al registrarse: el
-- trigger on_auth_user_created crea el perfil con ellos, y los emails
-- salen en el idioma de cada uno (D-044).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'display_name', u.display_name, 'locale', u.locale, 'weight_unit', u.weight_unit,
    'terms_version', 'draft-2026-11'
  ),
  now(), now(),
  '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'coach.iron@example.com',  'Iris Hierro',     'en', 'lb'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'coach.norte@example.com', 'Nora Norte',      'en', 'kg'),
  ('20000000-0000-4000-8000-000000000001'::uuid, 'ana@example.com',         'Ana Ejemplo',     'en', 'kg'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'bruno@example.com',       'Bruno Prueba',    'en', 'lb'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'carla@example.com',       'Carla Demo',      'es', 'kg'),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'diego@example.com',       'Diego Ficticio',  'en', 'kg'),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'elena@example.com',       'Elena Inventada', 'en', 'kg'),
  ('20000000-0000-4000-8000-000000000006'::uuid, 'fran@example.com',        'Fran Ejemplo',    'en', 'kg')
) as u (id, email, display_name, locale, weight_unit);

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@example.com';

-- Negocios y clientes, actuando como cada usuario.
do $$
declare
  v_iron  uuid;
  v_norte uuid;
  v_user  uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001"}', true);
  v_iron := public.create_tenant('Iron Lab', 'draft-2026-11');
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002"}', true);
  v_norte := public.create_tenant('Norte Strength', 'draft-2026-11');

  -- La misma marca que los datos de prueba de los tests de la app.
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Iron Lab', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#DC2626', 'accent', '#F59E0B'), 'mode', 'dark'
  ) where id = v_iron;
  update public.tenants set branding = jsonb_build_object(
    'appName', 'Norte Strength', 'logoPath', null,
    'colors', jsonb_build_object('primary', '#0F766E', 'accent', '#B45309'), 'mode', 'light'
  ) where id = v_norte;

  -- Norte Strength tiene un plan con más plazas (el plan lo cambia el
  -- propietario a mano hasta la Fase 5, D-020).
  update public.tenants set plan = 'starter' where id = v_norte;

  -- Códigos fijos, para poder escribirlos a mano en local.
  update public.tenant_invites set code = 'IRONLAB1' where tenant_id = v_iron;
  update public.tenant_invites set code = 'NORTE001' where tenant_id = v_norte;

  -- Iron Lab: 3 clientes, el plan free lleno.
  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('IRONLAB1');
  end loop;

  -- Norte Strength: diego, elena, la coach de Iron Lab y fran.
  foreach v_user in array array[
    '20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000006'
  ]::uuid[] loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user)::text, true);
    perform public.join_tenant_with_code('NORTE001');
  end loop;

  -- La coach de Norte da de baja a fran.
  perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002"}', true);
  perform public.archive_client(v_norte, '20000000-0000-4000-8000-000000000006');

  perform set_config('request.jwt.claims', '', true);
end
$$;
