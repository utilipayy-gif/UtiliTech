-- Orders table for tracking payment requests and Airpay transactions
create table if not exists public.site_orders (
  order_id text primary key,
  site_key text not null default 'utilitech',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_business text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'PENDING',
  airpay_txn_id text,
  airpay_status text,
  airpay_message text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_orders_site_created_idx
  on public.site_orders (site_key, created_at desc);
