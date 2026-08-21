create extension if not exists pgcrypto;

create table if not exists public.rings (
  id uuid primary key default gen_random_uuid(),
  startup_name text not null check (char_length(startup_name) between 2 and 80),
  website text,
  tagline text check (tagline is null or char_length(tagline) <= 120),
  tier text not null default 'free' check (tier in ('free','paid')),
  status text not null default 'rung',
  share_count integer not null default 0 check (share_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists rings_created_at_idx on public.rings (created_at desc);

create table if not exists public.fulfillment_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);

create table if not exists public.fulfillment_jobs (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  ring_id uuid references public.rings(id) on delete set null,
  startup_name text not null,
  email text not null,
  allow_social boolean not null default false,
  status text not null default 'reserved',
  provider_ref text,
  scheduled_at timestamptz,
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fulfillment_jobs_ring_id_idx on public.fulfillment_jobs (ring_id);
create index if not exists fulfillment_jobs_status_idx on public.fulfillment_jobs (status);

alter table public.rings enable row level security;
alter table public.fulfillment_events enable row level security;
alter table public.fulfillment_jobs enable row level security;

-- No anon/authenticated policies are intentional. All writes and reads in the MVP
-- go through server routes using the service-role key. Never expose that key client-side.
