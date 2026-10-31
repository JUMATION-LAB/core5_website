-- CORE5 Biomedical Engineering: database schema
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
