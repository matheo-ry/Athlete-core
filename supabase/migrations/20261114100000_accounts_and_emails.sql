-- =====================================================================
-- Migración 2: cuentas y emails (Fase 1, PR 1.2)
--
--   1. El perfil guarda qué versión de los términos aceptó el usuario y
--      cuándo (D-060).
--   2. El perfil nace con los datos que envía el registro: nombre,
--      idioma, unidad de peso y términos (D-040, D-044 y D-058).
--   3. accept_terms: el usuario confirmado vuelve a aceptar los términos
--      (D-043: lo que escribió quien registró el email antes que él no vale).
--   4. Tope de intentos en un esquema privado, que la API no expone (D-052).
--   5. email_status: dice si un email tiene cuenta, sin sesión (D-043).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Aceptación de los términos
-- ---------------------------------------------------------------------
alter table public.profiles
  add column terms_version     text check (terms_version is null or char_length(terms_version) between 1 and 40),
  add column terms_accepted_at timestamptz;

-- Nadie cambia estas dos columnas directamente: solo accept_terms y el
-- registro. El "grant update" de la migración 1 ya era columna a columna.


-- ---------------------------------------------------------------------
-- 2. El perfil nace con los datos del registro
--    Los datos de la cuenta (raw_user_meta_data) los escribe la app al
--    registrarse, así que son datos de fuera: se limpian en vez de
--    confiar en ellos. Un valor raro nunca impide crear la cuenta.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_meta   jsonb := case when jsonb_typeof(new.raw_user_meta_data) = 'object'
                         then new.raw_user_meta_data else '{}'::jsonb end;
  v_name   text  := left(trim(coalesce(v_meta ->> 'display_name', '')), 60);
  v_locale text  := v_meta ->> 'locale';
  v_unit   text  := v_meta ->> 'weight_unit';
  v_terms  text  := nullif(left(trim(coalesce(v_meta ->> 'terms_version', '')), 40), '');
begin
  insert into public.profiles (user_id, display_name, locale, weight_unit, terms_version, terms_accepted_at)
  values (
    new.id,
    v_name,
    case when v_locale in ('en', 'es') then v_locale else 'en' end,
    case when v_unit in ('kg', 'lb') then v_unit else 'kg' end,
    v_terms,
    case when v_terms is not null then now() end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 3. Aceptar los términos (lo llama la app al confirmar el email)
-- ---------------------------------------------------------------------
create function public.accept_terms(p_version text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_version is null or char_length(trim(p_version)) not between 1 and 40 then
    raise exception 'invalid_terms_version';
  end if;

  update public.profiles
  set terms_version = trim(p_version), terms_accepted_at = now()
  where user_id = auth.uid();
end;
$$;


-- ---------------------------------------------------------------------
-- 4. TOPE DE INTENTOS (D-052)
--    Vive en el esquema "private": la API de Supabase solo expone
--    "public", y aquí anon y authenticated no tienen ni acceso al esquema.
--    Solo lo usan las funciones SECURITY DEFINER de "public".
-- ---------------------------------------------------------------------
create schema private;
revoke all on schema private from public, anon, authenticated;

create table private.rate_limit_hits (
  id      bigint generated always as identity primary key,
  bucket  text not null,                 -- qué se limita: 'email_status', 'invite_code'…
  key     text not null,                 -- quién: un usuario o una dirección IP
  at      timestamptz not null default now()
);
create index rate_limit_hits_lookup_idx on private.rate_limit_hits (bucket, key, at desc);
-- Segunda capa: aunque alguien diera acceso al esquema por error, sin
-- políticas nadie lee ni escribe la tabla.
alter table private.rate_limit_hits enable row level security;

-- La conexión que hace la petición. Supabase pasa las cabeceras HTTP en
-- request.headers. Qué cabecera es fiable en la nube se comprueba al
-- crear staging (PR 1.17); si no llega ninguna, todos comparten 'unknown'.
create function private.request_ip()
returns text
language sql stable set search_path = '' as $$
  with h as (
    select coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb as headers
  )
  select coalesce(
    nullif(trim(h.headers ->> 'cf-connecting-ip'), ''),
    nullif(trim(h.headers ->> 'x-real-ip'), ''),
    nullif(trim(split_part(h.headers ->> 'x-forwarded-for', ',', 1)), ''),
    'unknown'
  )
  from h;
$$;

-- ¿Ha llegado esta clave a p_max intentos dentro de la ventana?
create function private.rate_limited(p_bucket text, p_key text, p_max int, p_window interval)
returns boolean
language sql stable set search_path = '' as $$
  select count(*) >= p_max
  from private.rate_limit_hits
  where bucket = p_bucket and key = p_key and at > now() - p_window;
$$;

-- Apunta un intento y borra los de esa clave con más de un día.
create function private.record_hit(p_bucket text, p_key text)
returns void
language sql volatile set search_path = '' as $$
  delete from private.rate_limit_hits
  where bucket = p_bucket and key = p_key and at < now() - interval '1 day';
  insert into private.rate_limit_hits (bucket, key) values (p_bucket, p_key);
$$;


-- ---------------------------------------------------------------------
-- 5. ¿TIENE CUENTA ESTE EMAIL? (D-043)
--    Devuelve 'none', 'unconfirmed' o 'confirmed', y nada más.
--    Se puede llamar sin sesión, con un tope de 20 comprobaciones cada
--    10 minutos por conexión (D-052).
-- ---------------------------------------------------------------------
create function public.email_status(p_email text)
returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key       text := private.request_ip();
  v_email     text := lower(trim(coalesce(p_email, '')));
  v_confirmed timestamptz;
begin
  if private.rate_limited('email_status', v_key, 20, interval '10 minutes') then
    raise exception 'rate_limited';
  end if;
  perform private.record_hit('email_status', v_key);

  if v_email = '' or char_length(v_email) > 320 then
    return 'none';
  end if;

  select u.email_confirmed_at into v_confirmed
  from auth.users u
  where lower(u.email) = v_email
    and u.deleted_at is null
    and not u.is_anonymous
  limit 1;

  if not found then
    return 'none';
  end if;

  return case when v_confirmed is null then 'unconfirmed' else 'confirmed' end;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. PERMISOS (las funciones nuevas nacen sin permisos, D-032)
-- ---------------------------------------------------------------------
grant execute on function public.accept_terms(text)  to authenticated;
grant execute on function public.email_status(text)  to anon, authenticated;
