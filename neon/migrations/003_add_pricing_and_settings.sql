alter table public.site_services add column if not exists price integer not null default 14999 check (price >= 0);

create table if not exists public.site_settings (
  site_key text primary key,
  phone text not null,
  email text not null,
  whatsapp text not null,
  address text not null,
  legal_name text not null,
  registration_date text not null,
  cin text not null,
  gst text not null,
  updated_at timestamptz not null default now()
);

update public.site_services set price=case slug
  when 'website-design' then 14999 when 'website-development' then 24999 when 'responsive-websites' then 17999
  when 'logo-design' then 7999 when 'website-redesign' then 19999 when 'website-maintenance' then 4999
  when 'corporate-websites' then 34999 when 'blog-websites' then 17999 when 'seo' then 9999
  when 'ppc-management' then 9999 when 'social-media' then 11999 when 'email-marketing' then 8999
  when 'custom-web-applications' then 49999 when 'content-management-systems' then 29999
  when 'school-management-systems' then 79999 when 'mobile-applications' then 69999 when 'ecommerce-websites' then 39999
  when 'motion-presentations' then 14999 when 'interactive-web-experiences' then 29999
  when 'digital-advertising-creative' then 9999 when 'domain-registration' then 1499
  when 'web-hosting' then 4999 when 'ssl-certificates' then 1999 else price end;
