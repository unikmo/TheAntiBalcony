alter table public.anti_balcony_order_events drop constraint if exists anti_balcony_order_events_source_check;
alter table public.anti_balcony_order_events
  add constraint anti_balcony_order_events_source_check
  check (source in ('customer','system','operations','blindspot','capture','shotstack','email','the-anti-balcony'));
