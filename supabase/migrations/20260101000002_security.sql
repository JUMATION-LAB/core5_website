-- Row Level Security: the public can read published content and send contact
-- messages; only users listed in team_admins can change anything.

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_admins where user_id = (select auth.uid()))
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.team_admins enable row level security;
create policy "own admin row" on public.team_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Public-readable content, admin-writable.
do $$
declare t text;
begin
  foreach t in array array['site_settings', 'project_stages', 'needs', 'gaps', 'evidence', 'lessons', 'gallery_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Content with a published flag: the public sees only published rows.
do $$
declare t text;
begin
  foreach t in array array['research_refs', 'team_members'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read published" on public.%I for select to anon, authenticated using (is_published or public.is_admin())', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Contact form: anyone may insert (column checks and the rate trigger apply);
-- only admins may read, update or delete.
alter table public.contact_messages enable row level security;
create policy "anyone can send" on public.contact_messages
  for insert to anon, authenticated with check (true);
create policy "admin read" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "admin update" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- Explicit table privileges (RLS above still decides which rows).
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.project_stages, public.needs, public.gaps,
  public.evidence, public.lessons, public.gallery_items, public.research_refs, public.team_members to anon;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
