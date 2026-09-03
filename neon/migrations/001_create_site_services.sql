-- Shared service catalogue for BillversTech and UtiliTech.
-- site_key keeps both brands isolated inside one Neon database.
create table if not exists public.site_services (
  site_key text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (char_length(category) between 1 and 120),
  short text not null check (char_length(short) between 10 and 500),
  intro text not null check (char_length(intro) between 20 and 5000),
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  deliverables jsonb not null default '[]'::jsonb check (jsonb_typeof(deliverables) = 'array'),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (site_key, slug)
);

create index if not exists site_services_site_order_idx
  on public.site_services (site_key, sort_order);

