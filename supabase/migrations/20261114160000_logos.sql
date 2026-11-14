-- =====================================================================
-- Migración 7: el logo del negocio (Fase 1, PR 1.16, D-051 y D-057)
--
-- Los logos van en Storage, en el espacio "logos", dentro de una carpeta con
-- el id del negocio: <tenant_id>/<archivo>. Solo el dueño de ese negocio
-- sube, cambia o borra; cualquiera puede verlos (salen en la vista previa
-- del código, sin sesión). El propio Storage rechaza lo que pase de 2 MB o
-- no sea PNG, JPG o WebP (D-057: SVG no, puede llevar código dentro).
--
-- Borrar un archivo se hace siempre con la API de Storage, nunca con SQL:
-- Supabase lo impide para que no quede el archivo huérfano.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']);


-- ---------------------------------------------------------------------
-- 1. ¿Puede el usuario tocar este archivo? Solo si la primera carpeta de la
--    ruta es un negocio del que es dueño. Una ruta rara (sin id de negocio)
--    no es de nadie.
-- ---------------------------------------------------------------------
create function public.can_manage_logo(p_object_name text)
returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_folder text := split_part(coalesce(p_object_name, ''), '/', 1);
begin
  if v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_member(v_folder::uuid, array['owner']);
end;
$$;

grant execute on function public.can_manage_logo(text) to authenticated;

-- Para ver los archivos ("cualquiera puede verlos") no hace falta permiso: el
-- espacio es público y se leen por su dirección. Estas reglas son para la API
-- de Storage con sesión: subir, sustituir, borrar y listar los propios.
create policy logos_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'logos' and public.can_manage_logo(name));

create policy logos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.can_manage_logo(name));

create policy logos_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.can_manage_logo(name))
  with check (bucket_id = 'logos' and public.can_manage_logo(name));

create policy logos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.can_manage_logo(name));


-- ---------------------------------------------------------------------
-- 2. Apuntar en la marca qué archivo es el logo, o quitarlo. Como la marca
--    ya no se cambia a mano (D-067), va por función: solo el dueño, y solo
--    un archivo de la carpeta de su negocio.
-- ---------------------------------------------------------------------
create function public.set_logo(p_tenant uuid, p_path text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;
  if p_path is null
     or split_part(p_path, '/', 1) <> p_tenant::text
     or p_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,100}$' then
    raise exception 'invalid_path';
  end if;

  update public.tenants
  set branding = jsonb_set(branding, '{logoPath}', to_jsonb(p_path), true)
  where id = p_tenant;

  insert into public.audit_log (tenant_id, actor_id, action)
  values (p_tenant, auth.uid(), 'tenant.logo_updated');
end;
$$;

-- Sin logo se ven las iniciales del negocio. El archivo se borra aparte, con
-- la API de Storage.
create function public.remove_logo(p_tenant uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;

  update public.tenants
  set branding = jsonb_set(branding, '{logoPath}', 'null'::jsonb, true)
  where id = p_tenant;

  insert into public.audit_log (tenant_id, actor_id, action)
  values (p_tenant, auth.uid(), 'tenant.logo_removed');
end;
$$;

grant execute on function public.set_logo(uuid, text) to authenticated;
grant execute on function public.remove_logo(uuid) to authenticated;
