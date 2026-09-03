alter table public.site_services add column if not exists packages jsonb not null default '[]'::jsonb;
