alter table public.anti_balcony_orders
  add column if not exists event_date date,
  add column if not exists preferred_window_code text,
  add column if not exists alternative_window_code text;

alter table public.anti_balcony_orders
  add constraint anti_balcony_orders_preferred_window_code_check check (preferred_window_code is null or preferred_window_code in ('08-12','12-16','16-20','20-24')),
  add constraint anti_balcony_orders_alternative_window_code_check check (alternative_window_code is null or alternative_window_code in ('08-12','12-16','16-20','20-24'));

create index if not exists anti_balcony_orders_event_date_idx on public.anti_balcony_orders (event_date, status);

comment on column public.anti_balcony_orders.event_date is 'Guaranteed customer display date in America/New_York.';
comment on column public.anti_balcony_orders.preferred_window_code is 'Preferred four-hour display window code.';
comment on column public.anti_balcony_orders.alternative_window_code is 'Optional backup four-hour display window code.';
