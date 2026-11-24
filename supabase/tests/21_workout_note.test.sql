-- =====================================================================
-- Nota final del entreno (PR 3.10b; D-ideas-10, D-126):
--   - Columna workouts.note (hasta 500 caracteres).
--   - Requiere consentimiento de datos de salud (health_consent_required).
--   - withdraw_health_consent la borra.
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

create function pg_temp.sync_with_note(p_note text, p_changed text, p_closed text default null)
returns void language sql as $fn$
  select public.sync_workout(current_setting('t.ta')::uuid, jsonb_build_object(
    'id', '10000000-0000-4000-8000-000000000001',
    'program_id', current_setting('t.p'), 'block_id', current_setting('t.blk'),
    'program_day_id', current_setting('t.day'), 'day_number', 1,
    'performed_on', current_setting('t.today'), 'started_at', current_setting('t.t0'),
    'last_changed_at', p_changed, 'closed_at', p_closed,
    'close_reason', case when p_closed is not null then 'completed' end,
    'device_id', 'phone-a', 'device_since', current_setting('t.t0'),
    'note', p_note,
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', '20000000-0000-4000-8000-000000000001', 'position', 1,
      'exercise_id', current_setting('t.ex'), 'program_day_exercise_id', current_setting('t.pde'),
      'prescribed_sets', '[{"reps_min":8,"reps_max":12}]'::jsonb, 'prescribed_rest_seconds', 120,
      'changed_at', current_setting('t.t0'), 'sets', '[]'::jsonb))))
$fn$;
grant execute on all functions in schema pg_temp to authenticated;

select set_config('t.t0', (now() - interval '2 hours')::text, true);
select set_config('t.t1', (now() - interval '1 hour')::text, true);
select set_config('t.t2', (now() - interval '30 minutes')::text, true);
select set_config('t.t3', (now() - interval '10 minutes')::text, true);
select set_config('t.today', ((now() - interval '2 hours') at time zone 'utc')::date::text, true);
select set_config('t.a', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select set_config('t.b', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select set_config('t.c', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
select set_config('t.d', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);

-- Setup: A y B crean negocio; C y D se unen a A; A asigna rutina a C.
set local role authenticated;
select set_config('request.jwt.claims', current_setting('t.b'), true);
select set_config('t.tb', public.create_tenant('Coach B', 'test-terms')::text, true);
select set_config('request.jwt.claims', current_setting('t.a'), true);
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select set_config('t.ex', (select id from public.exercises where library_key = 'back_squat')::text, true);
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

-- 1. Sin consentimiento de salud, sync_workout con note falla.
select set_config('request.jwt.claims', current_setting('t.c'), true);
select throws_ok(
  format('select pg_temp.sync_with_note(%L, %L)', 'Muy buenas sensaciones', current_setting('t.t0')),
  'P0001',
  'health_consent_required',
  'sin consentimiento de salud rechaza la nota final del entreno'
);

-- 2. Sin nota (null), sync_workout funciona incluso sin consentimiento.
select lives_ok(
  format('select pg_temp.sync_with_note(null, %L, %L)', current_setting('t.t0'), current_setting('t.t0')),
  'sin nota final el entreno se guarda sin consentimiento'
);

-- 3. Con consentimiento, una nota > 500 caracteres falla el check.
select public.grant_health_consent(current_setting('t.ta')::uuid, '2026-11-draft');
select throws_like(
  format('select pg_temp.sync_with_note(%L, %L, %L)', repeat('x', 501), current_setting('t.t1'), current_setting('t.t0')),
  '%workouts_note_check%',
  'la nota final no puede pasar de 500 caracteres'
);

-- 4. Con consentimiento, guarda la nota final en un entreno cerrado dentro de 7 días y marca edited_at.
select pg_temp.sync_with_note('  Buena sesión hoy  ', current_setting('t.t1'), current_setting('t.t0'));
select is(
  (select note from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  'Buena sesión hoy',
  'el cliente lee su nota final recortada'
);
select isnt(
  (select edited_at from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  null,
  'añadir nota tras cerrar marca edited_at'
);

-- 5. Aislamiento RLS: Coach A la ve, otro cliente D no la ve, Coach B (otro tenant) no la ve.
select set_config('request.jwt.claims', current_setting('t.a'), true);
select is(
  (select note from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  'Buena sesión hoy',
  'el coach del mismo tenant lee la nota final del cliente'
);
select set_config('request.jwt.claims', current_setting('t.d'), true);
select is(
  (select count(*)::int from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'otro cliente del mismo tenant no ve la nota ni el entreno'
);
select set_config('request.jwt.claims', current_setting('t.b'), true);
select is(
  (select count(*)::int from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'otro tenant no ve el entreno ni su nota'
);

-- 6. Si llega un payload más antiguo (t0 < t1), no pisa la nota más reciente.
select set_config('request.jwt.claims', current_setting('t.c'), true);
select pg_temp.sync_with_note('Nota vieja', current_setting('t.t0'), current_setting('t.t0'));
select is(
  (select note from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  'Buena sesión hoy',
  'un payload más antiguo no sobrescribe la nota final'
);

-- 7. withdraw_health_consent borra workouts.note.
select public.withdraw_health_consent(current_setting('t.ta')::uuid);
select is(
  (select note from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  null,
  'retirar el consentimiento borra workouts.note'
);

-- 8. Tras retirar consentimiento, volver a escribir nota falla.
select throws_ok(
  format('select pg_temp.sync_with_note(%L, %L, %L)', 'Otra nota', current_setting('t.t2'), current_setting('t.t0')),
  'P0001',
  'health_consent_required',
  'tras retirar el consentimiento vuelve a exigir permiso'
);

-- 9. El entreno sigue existiendo con edited_at intacto.
select is(
  (select count(*)::int from public.workouts where id = '10000000-0000-4000-8000-000000000001'),
  1,
  'retirar el consentimiento no borra el entreno'
);

select * from finish();
rollback;
