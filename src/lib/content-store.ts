import { neon } from "@neondatabase/serverless";
import { services as defaultServices, type Service } from "@/app/service-data";

const siteKey = "utilitech";

export function contentStoreIsConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}

export async function getServices(): Promise<Service[]> {
  if (!contentStoreIsConfigured()) return defaultServices;
  try {
    const rows = await database().query(
      `select slug, title, category, short, intro, benefits, deliverables
       from public.site_services
       where site_key = $1
       order by sort_order asc`,
      [siteKey],
    ) as Service[];
    return rows.length ? rows : defaultServices;
  } catch (error) {
    console.error("Using bundled service content because Neon is unavailable.", error);
    return defaultServices;
  }
}

export async function getService(slug: string) {
  return (await getServices()).find((service) => service.slug === slug);
}

export async function saveServices(services: Service[]) {
  const payload = services.map((service, sort_order) => ({ ...service, sort_order }));
  await database().query(
    `with deleted as (
       delete from public.site_services where site_key = $1
     )
     insert into public.site_services (
       site_key, slug, title, category, short, intro,
       benefits, deliverables, sort_order, updated_at
     )
     select
       $1, item.slug, item.title, item.category, item.short, item.intro,
       coalesce(item.benefits, '[]'::jsonb),
       coalesce(item.deliverables, '[]'::jsonb),
       coalesce(item.sort_order, 0), now()
     from jsonb_to_recordset($2::jsonb) as item(
       slug text, title text, category text, short text, intro text,
       benefits jsonb, deliverables jsonb, sort_order integer
     )`,
    [siteKey, JSON.stringify(payload)],
  );
}

