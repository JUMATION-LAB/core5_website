-- Storage buckets. Both are public-read (files are served by URL), writable
-- only by admins. Type and size limits are enforced by Supabase Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('research-docs', 'research-docs', true, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admin manage media" on storage.objects
  for all to authenticated
  using (bucket_id in ('public-media', 'research-docs') and public.is_admin())
  with check (bucket_id in ('public-media', 'research-docs') and public.is_admin());
