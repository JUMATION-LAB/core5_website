-- CORE5 Biomedical Engineering Design: database schema
-- Order: 001 schema, 002 security, 003 storage, 004 seed.

-- Who may edit content. Rows are added by hand in the SQL editor (see README).
create table public.team_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Flexible content documents: home, problem, screening, selected_need,
-- innovation, about, contact. Each is one JSON object edited in the dashboard.
create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Journey stages (home page) and design-process stages (timeline).
create table public.project_stages (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('journey', 'process')),
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  period text not null default '',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The initial 100 needs, the shortlist of 10 and the selected need.
create table public.needs (
  id bigint generated always as identity primary key,
  number int not null unique check (number > 0),
  title text not null check (char_length(title) between 1 and 300),
  area text not null default '',
  setting text not null default '',
  description text not null default '',
  status text not null default 'Identified',
  is_sample boolean not null default false,
  shortlisted boolean not null default false,
  shortlist_rank int,
  screening_outcome text not null default '',
  research_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gaps (
  id bigint generated always as identity primary key,
  position int not null default 0,
  approach text not null default '',
  advantages text not null default '',
  limitations text not null default '',
  unmet_needs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id bigint generated always as identity primary key,
  position int not null default 0,
  figure text not null default '',
  label text not null default '',
  source text not null default '',
  source_url text not null default '' check (source_url = '' or source_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_refs (
  id bigint generated always as identity primary key,
  category text not null check (category in ('Journal Articles', 'Research Papers', 'Medical Guidelines', 'Clinical Studies', 'Healthcare Statistics', 'Reference Documents')),
  title text not null check (char_length(title) between 1 and 400),
  authors text not null default '',
  year int check (year is null or year between 1800 and 2100),
  source text not null default '',
  summary text not null default '',
  relevance text not null default '',
  url text not null default '' check (url = '' or url ~* '^https?://'),
  document_path text not null default '',
  stage_id bigint references public.project_stages (id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id bigint generated always as identity primary key,
  position int not null default 0,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role text not null default '',
  bio text not null default '',
  contribution text not null default '',
  photo_path text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id bigint generated always as identity primary key,
  position int not null default 0,
  category text not null check (category in ('Initial sketches', 'Concept drawings', 'CAD models', 'Device illustrations', 'Prototype photographs', 'Process photographs')),
  caption text not null default '',
  image_path text not null check (image_path <> ''),
  stage_id bigint references public.project_stages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('challenge', 'decision', 'lesson', 'direction')),
  body text not null check (body <> ''),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages from the public contact form. Only admins can read them.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep updated_at fresh.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['site_settings', 'project_stages', 'needs', 'gaps', 'evidence',
                           'research_refs', 'team_members', 'gallery_items', 'lessons'] loop
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Basic spam brake: 3 messages per email and 60 messages overall per hour.
-- SECURITY DEFINER because the anonymous role cannot read the table.
create function public.limit_contact_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.contact_messages
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.contact_messages
         where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger limit_rate before insert on public.contact_messages
  for each row execute function public.limit_contact_rate();

create index on public.needs (shortlisted, shortlist_rank);
create index on public.project_stages (kind, position);
create index on public.research_refs (category, year desc);
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
-- Starter content. Safe to re-run. Replace everything from the admin dashboard.

insert into public.site_settings (key, value) values
  ('home', '{"stat1_value":100,"stat1_label":"Initial healthcare needs","stat2_value":10,"stat2_label":"Shortlisted needs","stat3_value":1,"stat3_label":"Primary need to investigate","stat4_value":5,"stat4_label":"Team members"}'),
  ('screening', jsonb_build_object('criteria', E'Clinical significance | How serious are the consequences for patients?\nUnmet need | How far do current solutions fall short?\nPotential impact | How many people could benefit?\nFeasibility | Can a student team realistically address it?\nAccessibility | Could it be affordable and usable in low-resource settings?\nLocal relevance | Does it matter in Uganda''s healthcare environment?')),
  ('problem', '{}'), ('selected_need', '{"confirmed":false}'), ('innovation', '{}'),
  ('about', '{}'), ('contact', '{}')
on conflict (key) do nothing;

-- Stages: statuses are placeholders. Update them to match real progress.
insert into public.project_stages (kind, position, title, description, status)
select * from (values
  ('journey', 1, 'Problem Identification', 'Surveying healthcare settings to surface real clinical challenges.', 'in_progress'),
  ('journey', 2, 'Needs Assessment', 'Recording, screening and rating observed needs.', 'in_progress'),
  ('journey', 3, 'Need Selection', 'Choosing one need to investigate in depth.', 'not_started'),
  ('journey', 4, 'Concept Development', 'Generating and comparing early design concepts.', 'not_started'),
  ('journey', 5, 'Prototyping', 'Building and refining a testable prototype.', 'not_started'),
  ('journey', 6, 'Evaluation', 'Testing against the need and documenting results.', 'not_started'),
  ('process', 1, 'Problem Discovery', '', 'in_progress'),
  ('process', 2, 'Needs Identification', '', 'in_progress'),
  ('process', 3, 'Needs Filtering', '', 'not_started'),
  ('process', 4, 'Need Prioritization', '', 'not_started'),
  ('process', 5, 'Concept Generation', '', 'not_started'),
  ('process', 6, 'Concept Selection', '', 'not_started'),
  ('process', 7, 'Prototype Development', '', 'not_started'),
  ('process', 8, 'Testing and Evaluation', '', 'not_started')
) as v(kind, position, title, description, status)
where not exists (select 1 from public.project_stages);

-- 100 clearly labelled sample needs (is_sample = true).
insert into public.needs (number, title, area, setting, description, status, is_sample)
select g, 'Sample need ' || g,
  (array['Cardiology','Maternal Health','Infectious Disease','Diagnostics','Surgery','Paediatrics','Critical Care','Oncology','Orthopaedics','Public Health'])[1 + (g - 1) % 10],
  (array['Referral hospital','Health centre','Community or home','District hospital'])[1 + (g - 1) % 4],
  'Sample description. Replace with the observed clinical problem, who it affects and how it was observed.',
  'Sample data', true
from generate_series(1, 100) g
on conflict (number) do nothing;

-- Five placeholder profiles. No names or details are invented.
insert into public.team_members (position, full_name, role)
select g, 'Team member ' || g, 'Role to be confirmed'
from generate_series(1, 5) g
where not exists (select 1 from public.team_members);

insert into public.gaps (position) select 1 where not exists (select 1 from public.gaps);
