create table if not exists public.anti_balcony_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  occasion text not null,
  package_tier text not null check (package_tier in ('snapshot','video','takeover')),
  event_date date not null,
  preferred_window text not null check (preferred_window in ('08-12','12-16','16-20','20-24')),
  backup_window text check (backup_window is null or backup_window in ('08-12','12-16','16-20','20-24')),
  any_time_same_day boolean not null default true,
  confirmed_window text check (confirmed_window is null or confirmed_window in ('08-12','12-16','16-20','20-24','any')),
  timezone text not null default 'America/New_York',
  creative_message text,
  creative_asset_url text,
  rights_confirmed boolean not null default false,
  terms_accepted boolean not null default false,
  status text not null default 'availability_check' check (status in ('availability_check','available','unavailable','manual_review','pending_payment','paid','booking','scheduled','live','proof_pending','proof_ready','failed','cancelled')),
  provider text not null default 'blindspot',
  provider_ref text,
  provider_hold_ref text,
  provider_hold_expires_at timestamptz,
  provider_quote jsonb not null default '{}'::jsonb,
  stripe_session_id text unique,
  proof_provider text not null default 'earthcam',
  proof_url text,
  video_url text,
  played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anti_balcony_booking_backup_diff check (backup_window is null or backup_window <> preferred_window)
);

create index if not exists anti_balcony_bookings_event_date_idx on public.anti_balcony_bookings (event_date, status);
create index if not exists anti_balcony_bookings_email_idx on public.anti_balcony_bookings (email, created_at desc);
create index if not exists anti_balcony_bookings_status_idx on public.anti_balcony_bookings (status, created_at desc);
alter table public.anti_balcony_bookings enable row level security;
grant select, insert, update, delete on public.anti_balcony_bookings to service_role;
alter table public.anti_balcony_fulfillment_jobs add column if not exists booking_id uuid references public.anti_balcony_bookings(id) on delete set null;
create index if not exists anti_balcony_fulfillment_jobs_booking_idx on public.anti_balcony_fulfillment_jobs (booking_id, created_at desc);
