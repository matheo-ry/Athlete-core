-- =====================================================================
-- PRUEBAS DE AISLAMIENTO (referencia para la Fase 1)
--
-- Qué es: la lista de casos que la base de datos debe superar, escrita
-- como script de psql. Se ejecutó contra Postgres 16 con esquema-base.sql
-- y plantilla-tabla-negocio.sql cargados, y los 29 casos pasaron.
--
-- Cómo usarlo: en la Fase 1 se convierte en tests pgTAP dentro de
-- supabase/tests/. NO se copia tal cual: hay que adaptarlo.
--
-- Qué hay que adaptar a Supabase real:
--   * Aquí se simuló Supabase con lo mínimo: los roles anon y
--     authenticated, un rol auth_admin que da de alta usuarios, una
--     tabla auth.users(id, email) y una función auth.uid() que lee el
--     ajuste 'request.jwt.claim.sub'. En Supabase, usa la forma que
--     recomienda su documentación para simular un usuario en los tests.
--   * auth.users tiene más columnas en Supabase.
--   * Los casos 15 a 19 y el 28 usan las tablas de ejemplo de la
--     plantilla. En la Fase 1 esas tablas no existen: esos casos se
--     escriben cuando se cree cada tabla de negocio.
--
-- Cómo leerlo: cada bloque cambia de usuario con
--   set role authenticated;  +  set_config('request.jwt.claim.sub', <id>)
-- y comprueba qué puede ver o hacer. "OK nn" es un caso superado;
-- "FALLO" detiene el script. Con "reset role" se vuelve al administrador,
-- que es quien prepara los datos de cada caso.
-- =====================================================================

\set ON_ERROR_STOP on
\set QUIET on
-- Usuarios: A y B coaches; C..F clientes.
-- Los crea un rol sin privilegios especiales, como hace el servicio de Auth:
-- así se comprueba que el trigger que crea el perfil funciona sin permisos extra.
set role auth_admin;
insert into auth.users (email) values ('a@x') returning id as a \gset
insert into auth.users (email) values ('b@x') returning id as b \gset
insert into auth.users (email) values ('c@x') returning id as c \gset
insert into auth.users (email) values ('d@x') returning id as d \gset
insert into auth.users (email) values ('e@x') returning id as e \gset
insert into auth.users (email) values ('f@x') returning id as f \gset
reset role;
select set_config('t.a', :'a', false), set_config('t.b', :'b', false), set_config('t.c', :'c', false) \gset
select set_config('t.d', :'d', false), set_config('t.e', :'e', false), set_config('t.f', :'f', false) \gset

do $$ declare n int; begin
  select count(*) into n from public.profiles;
  if n <> 6 then raise exception 'FALLO: perfiles creados = %', n; end if;
  raise notice 'OK 01: el trigger crea un perfil por usuario';
end $$;

-- ===== anon no puede nada =====
set role anon;
do $$ begin
  begin perform 1 from public.tenants; raise exception 'FALLO: anon lee tenants';
  exception when insufficient_privilege then raise notice 'OK 02: anon no puede leer tenants'; end;
  begin perform public.create_tenant('X'); raise exception 'FALLO: anon crea tenant';
  exception when insufficient_privilege then raise notice 'OK 03: anon no puede crear negocio'; end;
  begin perform public.preview_invite('ABCDEF12'); raise exception 'FALLO: anon previsualiza codigo';
  exception when insufficient_privilege then raise notice 'OK 04: anon no puede probar codigos'; end;
end $$;
reset role;

-- ===== A crea su negocio =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false) \gset
select public.create_tenant('Coach A') as ta \gset
select code as code_a from public.tenant_invites where tenant_id = :'ta' and is_active \gset
do $$ begin
  begin perform public.create_tenant('Otro'); raise exception 'FALLO: A crea dos negocios';
  exception when others then
    if sqlerrm <> 'already_owner' then raise; end if;
    raise notice 'OK 05: un usuario no puede ser dueño de dos negocios';
  end;
end $$;

-- ===== B crea su negocio =====
select set_config('request.jwt.claim.sub', :'b', false) \gset
select public.create_tenant('Coach B') as tb \gset
select code as code_b from public.tenant_invites where tenant_id = :'tb' and is_active \gset
reset role;
select set_config('t.ta', :'ta', false), set_config('t.tb', :'tb', false) \gset
select set_config('t.code_a', :'code_a', false), set_config('t.code_b', :'code_b', false) \gset

-- ===== B no ve nada de A =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'b', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.tenants;
  if n <> 1 then raise exception 'FALLO: B ve % tenants', n; end if;
  select count(*) into n from public.tenant_invites where tenant_id = current_setting('t.ta')::uuid;
  if n <> 0 then raise exception 'FALLO: B ve el codigo de A'; end if;
  select count(*) into n from public.tenant_members where tenant_id = current_setting('t.ta')::uuid;
  if n <> 0 then raise exception 'FALLO: B ve miembros de A'; end if;
  update public.tenants set name = 'hack' where id = current_setting('t.ta')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B edita el tenant de A'; end if;
  raise notice 'OK 06: un coach no ve ni edita nada de otro coach';
  begin perform public.regenerate_invite_code(current_setting('t.ta')::uuid);
    raise exception 'FALLO: B regenera el codigo de A';
  exception when others then
    if sqlerrm <> 'not_allowed' then raise; end if;
    raise notice 'OK 07: un coach no puede regenerar el codigo de otro';
  end;
end $$;

-- ===== C se une a A con el código =====
select set_config('request.jwt.claim.sub', :'c', false) \gset
do $$ declare n int; j jsonb; t uuid; begin
  select count(*) into n from public.tenants;
  if n <> 0 then raise exception 'FALLO: C ve tenants antes de unirse'; end if;
  j := public.preview_invite(lower(current_setting('t.code_a')));
  if j->>'name' <> 'Coach A' then raise exception 'FALLO: preview_invite = %', j; end if;
  begin perform public.join_tenant_with_code('ZZZZZZZZ'); raise exception 'FALLO: codigo falso aceptado';
  exception when others then if sqlerrm <> 'invalid_code' then raise; end if; end;
  t := public.join_tenant_with_code(current_setting('t.code_a'));
  if t <> current_setting('t.ta')::uuid then raise exception 'FALLO: join devuelve otro tenant'; end if;
  t := public.join_tenant_with_code(current_setting('t.code_a')); -- repetir no duplica
  select count(*) into n from public.tenants;
  if n <> 1 then raise exception 'FALLO: C ve % tenants tras unirse', n; end if;
  select count(*) into n from public.tenant_members;
  if n <> 1 then raise exception 'FALLO: C ve % filas de miembros (debe ver solo la suya)', n; end if;
  select count(*) into n from public.tenant_invites;
  if n <> 0 then raise exception 'FALLO: el cliente ve el codigo'; end if;
  update public.tenants set name = 'hack';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el cliente edita el tenant'; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FALLO: el cliente ve % perfiles', n; end if;
  raise notice 'OK 08: el cliente se une con codigo y solo ve lo suyo';
  begin insert into public.tenant_members (tenant_id, user_id, role)
        values (current_setting('t.tb')::uuid, auth.uid(), 'owner');
    raise exception 'FALLO: insercion directa en tenant_members';
  exception when insufficient_privilege then raise notice 'OK 09: nadie puede darse de alta a mano en un tenant'; end;
  begin update public.tenant_members set role = 'owner' where user_id = auth.uid();
    raise exception 'FALLO: el cliente se cambia el rol';
  exception when insufficient_privilege then raise notice 'OK 10: nadie puede cambiarse el rol'; end;
end $$;

-- ===== A: permisos de dueño =====
select set_config('request.jwt.claim.sub', :'a', false) \gset
do $$ declare n int; begin
  update public.tenants set name = 'Coach A2', branding = '{"appName":"A"}' where id = current_setting('t.ta')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: el dueño no puede editar su marca'; end if;
  begin update public.tenants set plan = 'studio'; raise exception 'FALLO: el coach cambia su plan';
  exception when insufficient_privilege then raise notice 'OK 11: el coach no puede cambiar su plan'; end;
  begin update public.tenants set status = 'active'; raise exception 'FALLO: el coach cambia su estado';
  exception when insufficient_privilege then raise notice 'OK 12: el coach no puede cambiar su estado'; end;
  select count(*) into n from public.tenant_members;
  if n <> 2 then raise exception 'FALLO: A ve % miembros (esperado 2)', n; end if;
  select count(*) into n from public.profiles;
  if n <> 2 then raise exception 'FALLO: A ve % perfiles (esperado 2)', n; end if;
  select count(*) into n from public.tenant_effective_features;
  raise notice 'OK 13: el dueño edita nombre y marca y ve a sus miembros';
end $$;
reset role;

-- ===== Límite del plan (free = 3 clientes) =====
set role authenticated;
select set_config('request.jwt.claim.sub', :'d', false) \gset
select public.join_tenant_with_code(:'code_a') \gset
select set_config('request.jwt.claim.sub', :'e', false) \gset
select public.join_tenant_with_code(:'code_a') \gset
select set_config('request.jwt.claim.sub', :'f', false) \gset
do $$ begin
  begin perform public.join_tenant_with_code(current_setting('t.code_a'));
    raise exception 'FALLO: se supera el limite del plan';
  exception when others then
    if sqlerrm <> 'plan_limit_reached' then raise; end if;
    raise notice 'OK 14: el limite de clientes del plan se respeta';
  end;
end $$;

-- ===== Plantilla de tabla de negocio =====
select set_config('request.jwt.claim.sub', :'a', false) \gset
insert into public.programs (tenant_id, title, created_by) values (:'ta', 'Fuerza 5x5', :'a') returning id as pa \gset
insert into public.program_assignments (tenant_id, program_id, client_id) values (:'ta', :'pa', :'c');
select set_config('request.jwt.claim.sub', :'b', false) \gset
insert into public.programs (tenant_id, title, created_by) values (:'tb', 'Rutina B', :'b') returning id as pb \gset
reset role;
select set_config('t.pa', :'pa', false), set_config('t.pb', :'pb', false) \gset
set role authenticated;
select set_config('request.jwt.claim.sub', :'b', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.programs;
  if n <> 1 then raise exception 'FALLO: B ve % rutinas', n; end if;
  begin insert into public.programs (tenant_id, title, created_by)
        values (current_setting('t.ta')::uuid, 'intrusa', auth.uid());
    raise exception 'FALLO: B crea una rutina en el tenant de A';
  exception when insufficient_privilege then raise notice 'OK 15: no se puede escribir en el tenant de otro coach'; end;
  begin insert into public.program_assignments (tenant_id, program_id, client_id)
        values (current_setting('t.tb')::uuid, current_setting('t.pb')::uuid, current_setting('t.c')::uuid);
    raise exception 'FALLO: B asigna su rutina a un cliente de A';
  exception when foreign_key_violation then raise notice 'OK 16: la clave compuesta impide mezclar clientes de otro coach'; end;
  begin insert into public.program_assignments (tenant_id, program_id, client_id)
        values (current_setting('t.tb')::uuid, current_setting('t.pa')::uuid, current_setting('t.b')::uuid);
    raise exception 'FALLO: B usa una rutina de A';
  exception when foreign_key_violation then raise notice 'OK 17: la clave compuesta impide usar rutinas de otro coach'; end;
end $$;

select set_config('request.jwt.claim.sub', :'c', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.programs;
  if n <> 1 then raise exception 'FALLO: el cliente ve % rutinas', n; end if;
  select count(*) into n from public.program_assignments;
  if n <> 1 then raise exception 'FALLO: el cliente ve % asignaciones', n; end if;
  begin insert into public.programs (tenant_id, title, created_by)
        values (current_setting('t.ta')::uuid, 'del cliente', auth.uid());
    raise exception 'FALLO: el cliente crea rutinas';
  exception when insufficient_privilege then raise notice 'OK 18: el cliente lee sus rutinas pero no las crea'; end;
end $$;
select set_config('request.jwt.claim.sub', :'d', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.program_assignments;
  if n <> 0 then raise exception 'FALLO: un cliente ve asignaciones de otro cliente'; end if;
  raise notice 'OK 19: un cliente no ve las asignaciones de otro cliente';
end $$;

-- ===== Archivar a un cliente =====
select set_config('request.jwt.claim.sub', :'b', false) \gset
do $$ declare n int; begin
  update public.tenant_members set status = 'archived' where user_id = current_setting('t.c')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B archiva a un cliente de A'; end if;
end $$;
select set_config('request.jwt.claim.sub', :'a', false) \gset
do $$ declare n int; begin
  update public.tenant_members set status = 'archived' where user_id = current_setting('t.c')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: A no puede archivar a su cliente'; end if;
  update public.tenant_members set status = 'archived' where user_id = auth.uid();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el dueño se archiva a si mismo'; end if;
end $$;
select set_config('request.jwt.claim.sub', :'c', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.tenants;
  if n <> 0 then raise exception 'FALLO: un cliente archivado sigue viendo el tenant'; end if;
  select count(*) into n from public.programs;
  if n <> 0 then raise exception 'FALLO: un cliente archivado sigue viendo rutinas'; end if;
  raise notice 'OK 20: solo su coach puede archivar a un cliente, y al archivarlo pierde el acceso';
end $$;
-- Con un hueco libre, F ya puede entrar; y C puede volver con el código
select set_config('request.jwt.claim.sub', :'f', false) \gset
select public.join_tenant_with_code(:'code_a') \gset
select set_config('request.jwt.claim.sub', :'c', false) \gset
do $$ begin
  begin perform public.join_tenant_with_code(current_setting('t.code_a'));
    raise exception 'FALLO: reactivacion supera el limite';
  exception when others then
    if sqlerrm <> 'plan_limit_reached' then raise; end if;
    raise notice 'OK 21: archivar libera un hueco y reactivar respeta el limite';
  end;
end $$;

-- ===== Regenerar código =====
select set_config('request.jwt.claim.sub', :'a', false) \gset
select public.regenerate_invite_code(:'ta') as code_a2 \gset
reset role;
select set_config('t.code_a2', :'code_a2', false) \gset
set role authenticated;
select set_config('request.jwt.claim.sub', :'c', false) \gset
do $$ begin
  if public.preview_invite(current_setting('t.code_a')) is not null then
    raise exception 'FALLO: el codigo antiguo sigue valiendo'; end if;
  if public.preview_invite(current_setting('t.code_a2')) is null then
    raise exception 'FALLO: el codigo nuevo no vale'; end if;
  raise notice 'OK 22: al regenerar, el codigo antiguo deja de valer';
end $$;
reset role;

-- ===== Feature flags =====
insert into public.features (key, kind, sunset_at) values
  ('workouts', 'core', null),
  ('macros_calculator', 'addon', null),
  ('new_editor', 'release', '2027-06-30'),
  ('signups', 'kill_switch', null);
insert into public.plan_features (plan, feature_key) values ('pro', 'macros_calculator');

set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false) \gset
do $$ declare n int; begin
  select count(*) into n from public.tenant_effective_features;
  if n <> 4 then raise exception 'FALLO: A ve % flags (esperado 4: solo los de su tenant)', n; end if;
  if not (select enabled from public.tenant_effective_features where feature_key = 'workouts') then
    raise exception 'FALLO: un flag core no esta activo'; end if;
  if not (select enabled from public.tenant_effective_features where feature_key = 'signups') then
    raise exception 'FALLO: un kill_switch no esta activo por defecto'; end if;
  if (select enabled from public.tenant_effective_features where feature_key = 'macros_calculator') then
    raise exception 'FALLO: un addon esta activo sin que lo incluya el plan'; end if;
  if (select enabled from public.tenant_effective_features where feature_key = 'new_editor') then
    raise exception 'FALLO: un flag release esta activo por defecto'; end if;
  raise notice 'OK 23: core y kill_switch activos; addon y release apagados por defecto';
  begin insert into public.tenant_features (tenant_id, feature_key, enabled)
        values (current_setting('t.ta')::uuid, 'macros_calculator', true);
    raise exception 'FALLO: el coach se activa una funcion de pago';
  exception when insufficient_privilege then raise notice 'OK 24: el coach no puede activarse funciones de pago'; end;
  begin update public.features set is_enabled = true;
    raise exception 'FALLO: el coach toca el catalogo de flags';
  exception when insufficient_privilege then raise notice 'OK 25: el coach no puede tocar el catalogo de flags'; end;
end $$;
reset role;

update public.tenants set plan = 'pro' where id = :'ta';
insert into public.tenant_features (tenant_id, feature_key, enabled, source, expires_at)
values (:'ta', 'new_editor', true, 'trial', now() + interval '1 day');
set role authenticated;
do $$ begin
  if not (select enabled from public.tenant_effective_features where feature_key = 'macros_calculator') then
    raise exception 'FALLO: el addon incluido en el plan no esta activo'; end if;
  if not (select enabled from public.tenant_effective_features where feature_key = 'new_editor') then
    raise exception 'FALLO: la excepcion del tenant no esta activa'; end if;
  raise notice 'OK 26: el plan y las excepciones del tenant activan funciones';
end $$;
reset role;

update public.tenant_features set expires_at = now() - interval '1 minute'
where tenant_id = :'ta' and feature_key = 'new_editor';
update public.features set is_enabled = false where key = 'workouts';
set role authenticated;
do $$ begin
  if (select enabled from public.tenant_effective_features where feature_key = 'new_editor') then
    raise exception 'FALLO: una excepcion caducada sigue activa'; end if;
  if (select enabled from public.tenant_effective_features where feature_key = 'workouts') then
    raise exception 'FALLO: el interruptor general no apaga el flag'; end if;
  raise notice 'OK 27: las excepciones caducan y el interruptor general apaga para todos';
end $$;

-- ===== updated_at (tabla de ejemplo de la plantilla) =====
do $$ declare ok boolean; begin
  update public.programs set title = 'Fuerza 5x5 v2' where id = current_setting('t.pa')::uuid;
  select updated_at > created_at into ok from public.programs where id = current_setting('t.pa')::uuid;
  if not ok then raise exception 'FALLO: updated_at no se actualiza'; end if;
  raise notice 'OK 28: updated_at se actualiza solo al editar';
end $$;
reset role;

-- ===== Comprobación del CI =====
do $$ declare n int; begin
  select count(*) into n from pg_tables where schemaname = 'public' and rowsecurity = false;
  if n <> 0 then raise exception 'FALLO: % tablas publicas sin RLS', n; end if;
  raise notice 'OK 29: ninguna tabla publica sin RLS';
end $$;
