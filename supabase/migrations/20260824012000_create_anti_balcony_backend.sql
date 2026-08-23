create table if not exists public.anti_balcony_rings (
  id uuid primary key,
  slug text not null unique,
  startup_name text not null,
  website text,
  tagline text,
  category text,
  what_it_does text,
  intended_customer text,
  founder text,
  problem text,
  story text,
  image_url text,
  social_url text,
  tier text not null default 'free' check (tier in ('free','snapshot','video','takeover','vip')),
  status text not null default 'rung',
  indexable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anti_balcony_rings_created_at_idx
  on public.anti_balcony_rings (created_at desc);
create index if not exists anti_balcony_rings_indexable_idx
  on public.anti_balcony_rings (indexable, created_at desc);

create table if not exists public.anti_balcony_fulfillment_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.anti_balcony_fulfillment_jobs (
  stripe_session_id text primary key,
  event_id text,
  ring_id uuid references public.anti_balcony_rings(id) on delete set null,
  startup_name text not null,
  email text not null,
  allow_social boolean not null default false,
  provider_ref text,
  scheduled_at timestamptz,
  tier text not null check (tier in ('snapshot','video','takeover','vip')),
  operations jsonb not null default '{}'::jsonb,
  operations_clearance text not null default 'not_required',
  status text not null,
  proof_url text,
  video_url text,
  live_stream_url text,
  behind_scenes_url text,
  press_kit_url text,
  pr_distribution_url text,
  permit_ref text,
  insurance_ref text,
  talent_release_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anti_balcony_fulfillment_jobs_ring_idx
  on public.anti_balcony_fulfillment_jobs (ring_id, created_at desc);
create index if not exists anti_balcony_fulfillment_jobs_status_idx
  on public.anti_balcony_fulfillment_jobs (status, created_at desc);

alter table public.anti_balcony_rings enable row level security;
alter table public.anti_balcony_fulfillment_events enable row level security;
alter table public.anti_balcony_fulfillment_jobs enable row level security;

comment on table public.anti_balcony_rings is
  'The Anti-Balcony public startup launch Rings. Server-managed; public exposure is through the application.';
comment on table public.anti_balcony_fulfillment_events is
  'Stripe webhook idempotency claims for The Anti-Balcony.';
comment on table public.anti_balcony_fulfillment_jobs is
  'Paid fulfillment operations for The Anti-Balcony.';
