alter table public.anti_balcony_fulfillment_jobs drop column if exists booking_id;
drop table if exists public.anti_balcony_bookings;

alter table public.anti_balcony_orders alter column ring_id drop not null;
alter table public.anti_balcony_orders alter column creative_width drop not null;
alter table public.anti_balcony_orders alter column creative_height drop not null;
alter table public.anti_balcony_orders alter column board set default 'times_square_flexible';

alter table public.anti_balcony_orders
  add column if not exists customer_name text,
  add column if not exists occasion text,
  add column if not exists creative_message text,
  add column if not exists any_time_same_day boolean not null default true,
  add column if not exists provider_hold_ref text,
  add column if not exists provider_hold_expires_at timestamptz,
  add column if not exists provider_quote jsonb not null default '{}'::jsonb,
  add column if not exists stripe_session_id text;

create unique index if not exists anti_balcony_orders_stripe_session_idx on public.anti_balcony_orders (stripe_session_id) where stripe_session_id is not null;

alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_check;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_check1;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_check2;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_board_check;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_creative_dimensions_check;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_payment_status_check;
alter table public.anti_balcony_orders drop constraint if exists anti_balcony_orders_status_check;

alter table public.anti_balcony_orders
  add constraint anti_balcony_orders_requested_window_4h_check check (requested_window_end = requested_window_start + interval '4 hours'),
  add constraint anti_balcony_orders_alternative_window_4h_check check ((alternative_window_start is null and alternative_window_end is null) or (alternative_window_start is not null and alternative_window_end is not null and alternative_window_end = alternative_window_start + interval '4 hours')),
  add constraint anti_balcony_orders_scheduled_window_check check ((scheduled_window_start is null and scheduled_window_end is null) or (scheduled_window_start is not null and scheduled_window_end is not null and scheduled_window_end >= scheduled_window_start and scheduled_window_end <= scheduled_window_start + interval '4 hours')),
  add constraint anti_balcony_orders_board_check check (board in ('times_square_flexible','nasdaq_tower')),
  add constraint anti_balcony_orders_creative_dimensions_check check ((creative_width is null and creative_height is null) or (creative_width > 0 and creative_height > creative_width and abs((creative_width::numeric / creative_height::numeric) - (9::numeric / 16::numeric)) <= 0.015)),
  add constraint anti_balcony_orders_payment_status_check check (payment_status in ('not_requested','pending','paid','manual_paid','waived','refunded')),
  add constraint anti_balcony_orders_status_check check (status in ('creative_upload_pending','availability_check','available','unavailable','manual_review','inventory_held','creative_review','needs_changes','payment_pending','paid','booking','booked','scheduled','played','capture_required','capture_processing','capture_ready','packaging_required','packaging','proof_ready','delivered','cancelled','failed'));

comment on column public.anti_balcony_orders.requested_window_start is 'Start of the customer preferred four-hour display window in the stored timezone.';
comment on column public.anti_balcony_orders.requested_window_end is 'End of the customer preferred four-hour display window. The product guarantees the date/window, not an exact playback minute.';
comment on column public.anti_balcony_orders.any_time_same_day is 'If true, provider routing may use another same-day four-hour window after preferred and alternative windows fail.';
comment on column public.anti_balcony_orders.board is 'times_square_flexible is the default promise; nasdaq_tower is reserved for explicitly sold screen-specific inventory.';
