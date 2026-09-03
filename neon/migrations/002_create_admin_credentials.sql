create table if not exists public.site_admin_credentials (
  site_key text primary key,
  email text not null,
  password_hash text not null,
  password_salt text not null,
  updated_at timestamptz not null default now()
);
