create extension if not exists pgcrypto;

create table if not exists public.lakes (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  slug text unique not null,
  name text not null,
  county text,
  locality text,
  latitude double precision not null,
  longitude double precision not null,
  description text,
  species text[] not null default '{}',
  fishing_modes text[],
  opening_hours text,
  price_info text,
  phone text,
  website text,
  facilities text[] not null default '{}',
  verification_status text not null default 'unverified' check (verification_status in ('verified','community-confirmed','unverified','possibly-closed')),
  verified_at timestamptz,
  source_name text,
  source_url text,
  image_url text,
  rating numeric(2,1),
  rating_count integer,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lakes_coordinates_idx on public.lakes(latitude,longitude);
create index if not exists lakes_status_idx on public.lakes(verification_status);
create index if not exists lakes_name_idx on public.lakes using gin(to_tsvector('simple',name));

create table if not exists public.sync_runs (
  id bigint generated always as identity primary key,
  source text not null,
  status text not null,
  items_found integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.lake_reports (
  id uuid primary key default gen_random_uuid(),
  lake_id uuid references public.lakes(id) on delete cascade,
  report_type text not null,
  message text,
  reporter_email text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.lakes enable row level security;
alter table public.sync_runs enable row level security;
alter table public.lake_reports enable row level security;

drop policy if exists "public can read active lakes" on public.lakes;
create policy "public can read active lakes" on public.lakes for select using (verification_status <> 'possibly-closed');

drop policy if exists "public can submit reports" on public.lake_reports;
create policy "public can submit reports" on public.lake_reports for insert with check (true);

-- Importă seed-ul manual din aplicație sau lasă cron-ul să aducă locații OSM.
-- Locațiile OSM intră automat cu statusul 'unverified'.
