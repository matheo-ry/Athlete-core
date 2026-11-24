-- =====================================================================
-- Series de calentamiento (PR 3.19; D-ideas-2):
--   - profiles.warmup_sets_enabled (false por defecto, editable por su usuario).
--   - workout_sets.is_warmup (false por defecto), clave única con is_warmup.
--   - Reglas: 1..5, sin lado (incluso en unilaterales), sin is_extra ni intensidad.
--   - Aislamiento RLS por tenant y cliente.
--
-- Usuarios inventados: A y B son coaches; C y D, clientes de A.
-- =====================================================================
begin;
set local role postgres;
grant usage on schema extensions to public;
create extension if not exists pgtap with schema extensions;
set local search_path to "$user", public, extensions;

select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'coach-b@example.test'),
  ('00000000-0000-4000-8000-00000000000c', 'client-c@example.test'),
  ('00000000-0000-4000-8000-00000000000d', 'client-d@example.test');

create function pg_temp.template(p_exercise uuid) returns jsonb language sql as $fn$
  select jsonb_build_object('name', 'Plantilla A', 'blocks', jsonb_build_array(
    jsonb_build_object('cycle_days', 7, 'laps', null, 'days',
      (select jsonb_agg(jsonb_build_object(
         'day_number', n, 'kind', case when n = 1 then 'training' else 'rest' end,
         'exercises', case when n = 1 then jsonb_build_array(jsonb_build_object(
           'exercise_id', p_exercise, 'rest_seconds', 120, 'sets',
           (select jsonb_agg(jsonb_build_object('reps_min', 8, 'reps_max', 12))
            from generate_series(1, 3)))) else '[]'::jsonb end) order by n)
       from generate_series(1, 7) n))))
$fn$;

create function pg_temp.sync_sets(p_sets jsonb) returns void language sql as $fn$
  select public.sync_workout(current_setting('t.ta')::uuid, jsonb_build_object(
    'id', '10000000-0000-4000-8000-000000000010',
    'program_id', current_setting('t.p'), 'block_id', current_setting('t.blk'),
    'program_day_id', current_setting('t.day'), 'day_number', 1,
    'performed_on', current_setting('t.today'), 'started_at', current_setting('t.t0'),
    'last_changed_at', current_setting('t.t1'),
    'device_id', 'phone-a', 'device_since', current_setting('t.t0'),
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', '20000000-0000-4000-8000-000000000010', 'position', 1,
      'exercise_id', current_setting('t.ex'), 'program_day_exercise_id', current_setting('t.pde'),
      'prescribed_sets', '[{"reps_min":8,"reps_max":12}]'::jsonb, 'prescribed_rest_seconds', 120,
      'changed_at', current_setting('t.t1'), 'sets', p_sets))))
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.t0', (now() - interval '2 hours')::text, true);
select set_config('t.t1', (now() - interval '1 hour')::text, true);
select set_config('t.today', ((now() - interval '2 hours') at time zone 'utc')::date::text, true);
select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select set_config('t.b', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);

set local role authenticated;
select set_config('request.jwt.claims', current_setting('t.b'), true);
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
-- Unilateral exercise to verify side = 'none' rule on warmups!
select set_config('t.ex', (select id from public.exercises where tenant_id = current_setting('t.ta')::uuid and is_unilateral limit 1)::text, true);
select set_config('t.code_a',
  (select code from public.tenant_invites where is_active and tenant_id = current_setting('t.ta')::uuid), true);
select set_config('t.tpl', public.save_program(current_setting('t.ta')::uuid,
  pg_temp.template(current_setting('t.ex')::uuid)) ->> 'id', true);

select set_config('request.jwt.claims', current_setting('t.c'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));
select set_config('request.jwt.claims', current_setting('t.d'), true);
select public.join_tenant_with_code(current_setting('t.code_a'));

select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.p', public.assign_program(
  current_setting('t.ta')::uuid, current_setting('t.tpl')::uuid,
  array['00000000-0000-4000-8000-00000000000c'::uuid], current_setting('t.today')::date, 'calendar',
  current_setting('t.today')::date) -> 0 ->> 'program_id', true);
select set_config('t.blk', (select id from public.program_blocks where program_id = current_setting('t.p')::uuid)::text, true);
select set_config('t.day', (select id from public.program_days where program_id = current_setting('t.p')::uuid and day_number = 1)::text, true);
select set_config('t.pde', (select id from public.program_day_exercises where program_id = current_setting('t.p')::uuid)::text, true);

-- 1. warmup_sets_enabled empieza en false y solo lo cambia su usuario.
select set_config('request.jwt.claims', current_setting('t.c'), true);
select is(
  (select warmup_sets_enabled from public.profiles where user_id = '00000000-0000-4000-8000-00000000000c'),
  false,
  'warmup_sets_enabled por defecto es false'
);
update public.profiles set warmup_sets_enabled = true where user_id = '00000000-0000-4000-8000-00000000000c';
select is(
  (select warmup_sets_enabled from public.profiles where user_id = '00000000-0000-4000-8000-00000000000c'),
  true,
  'el usuario puede activar warmup_sets_enabled en su perfil'
);

-- 2. En ejercicio unilateral, calentamiento con side='right' falla.
select throws_ok(
  format('select pg_temp.sync_sets(%L::jsonb)', jsonb_build_array(jsonb_build_object(
    'id', '30000000-0000-4000-8000-000000000001', 'set_number', 1, 'side', 'right',
    'weight_kg', 20, 'reps', 10, 'is_warmup', true, 'is_done', true, 'recorded_at', current_setting('t.t1')
  ))::text),
  'P0001',
  'invalid_side',
  'el calentamiento no admite lado distinto de none'
);

-- 3. Calentamiento con set_number = 6 falla workout_sets_warmup_rules.
select throws_like(
  format('select pg_temp.sync_sets(%L::jsonb)', jsonb_build_array(jsonb_build_object(
    'id', '30000000-0000-4000-8000-000000000002', 'set_number', 6, 'side', 'none',
    'weight_kg', 20, 'reps', 10, 'is_warmup', true, 'is_done', true, 'recorded_at', current_setting('t.t1')
  ))::text),
  '%workout_sets_warmup_rules%',
  'el calentamiento admite máximo 5 series'
);

-- 4. Calentamiento con intensidad falla workout_sets_warmup_rules.
select throws_like(
  format('select pg_temp.sync_sets(%L::jsonb)', jsonb_build_array(jsonb_build_object(
    'id', '30000000-0000-4000-8000-000000000003', 'set_number', 1, 'side', 'none',
    'weight_kg', 20, 'reps', 10, 'intensity_type', 'rir', 'intensity_value', 2,
    'is_warmup', true, 'is_done', true, 'recorded_at', current_setting('t.t1')
  ))::text),
  '%workout_sets_warmup_rules%',
  'el calentamiento no admite RIR/RPE'
);

-- 5. Calentamiento con is_extra = true falla workout_sets_warmup_rules.
select throws_like(
  format('select pg_temp.sync_sets(%L::jsonb)', jsonb_build_array(jsonb_build_object(
    'id', '30000000-0000-4000-8000-000000000004', 'set_number', 1, 'side', 'none',
    'weight_kg', 20, 'reps', 10, 'is_extra', true,
    'is_warmup', true, 'is_done', true, 'recorded_at', current_setting('t.t1')
  ))::text),
  '%workout_sets_warmup_rules%',
  'el calentamiento no puede ser is_extra'
);

-- 6. Calentamiento C1 (side=none) y efectiva 1 (side=right y side=left) conviven sin chocar.
select lives_ok(
  format('select pg_temp.sync_sets(%L::jsonb)', jsonb_build_array(
    jsonb_build_object(
      'id', '30000000-0000-4000-8000-000000000005', 'set_number', 1, 'side', 'none',
      'weight_kg', 10, 'reps', 12, 'is_warmup', true, 'is_done', true, 'recorded_at', current_setting('t.t1')
    ),
    jsonb_build_object(
      'id', '30000000-0000-4000-8000-000000000006', 'set_number', 1, 'side', 'right',
      'weight_kg', 20, 'reps', 10, 'intensity_type', 'rir', 'intensity_value', 2,
      'is_warmup', false, 'is_done', true, 'recorded_at', current_setting('t.t1')
    ),
    jsonb_build_object(
      'id', '30000000-0000-4000-8000-000000000007', 'set_number', 1, 'side', 'left',
      'weight_kg', 20, 'reps', 10, 'intensity_type', 'rir', 'intensity_value', 2,
      'is_warmup', false, 'is_done', true, 'recorded_at', current_setting('t.t1')
    )
  )::text),
  'calentamiento y series efectivas con el mismo número conviven sin chocar'
);

select is(
  (select count(*)::int from public.workout_sets where workout_id = '10000000-0000-4000-8000-000000000010' and is_warmup),
  1,
  'el cliente lee su serie de calentamiento'
);

-- 7. Aislamiento RLS: Coach A la ve, otro cliente D no la ve, Coach B (otro tenant) no la ve.
select set_config('request.jwt.claims', current_setting('t.a'), true);
select is(
  (select count(*)::int from public.workout_sets where workout_id = '10000000-0000-4000-8000-000000000010' and is_warmup),
  1,
  'el coach del mismo tenant lee el calentamiento de su cliente'
);
select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(
  (select count(*)::int from public.workout_sets where workout_id = '10000000-0000-4000-8000-000000000010'),
  0,
  'otro cliente del mismo tenant no ve las series'
);
select set_config('request.jwt.claims', current_setting('t.b'), true);
select is(
  (select count(*)::int from public.workout_sets where workout_id = '10000000-0000-4000-8000-000000000010'),
  0,
  'otro tenant no ve las series'
);

-- 8. Coach A no puede cambiar warmup_sets_enabled de C.
select set_config('request.jwt.claims', current_setting('t.a'), true);
update public.profiles set warmup_sets_enabled = false where user_id = '00000000-0000-4000-8000-00000000000c';
select set_config('request.jwt.claims', current_setting('t.c'), true);
select is(
  (select warmup_sets_enabled from public.profiles where user_id = '00000000-0000-4000-8000-00000000000c'),
  true,
  'otro usuario no puede cambiar warmup_sets_enabled de C'
);

select * from finish();
rollback;
