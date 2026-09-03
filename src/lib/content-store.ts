import { neon } from "@neondatabase/serverless";
import { services as defaultServices, servicePrice, type Service } from "@/app/service-data";

const siteKey = "utilitech";
const pricedDefaults=defaultServices.map(service=>({...service,price:servicePrice(service)}));

export type SiteSettings = { phone:string; email:string; whatsapp:string; address:string; legalName:string; registrationDate:string; cin:string; gst:string };
export const defaultSiteSettings:SiteSettings={phone:"+91 96531 27760",email:"utilipayhub@gmail.com",whatsapp:"919653127760",address:"C/O Rajesh Kumari, 1st Floor, Patiala Chowk, Jind, Haryana, India, 126102",legalName:"BILLVERSE TECHNOLOGIES (OPC) PRIVATE LIMITED",registrationDate:"20/07/2026",cin:"U82990HR2026OPC148111",gst:"06AAOCB9584D1ZA"};

export function contentStoreIsConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}

export async function getServices(): Promise<Service[]> {
  if (!contentStoreIsConfigured()) return pricedDefaults;
  try {
    const rows = await database().query(
      `select slug, title, category, short, intro, benefits, deliverables, price, packages
       from public.site_services
       where site_key = $1
       order by sort_order asc`,
      [siteKey],
    ) as Service[];
    return rows.length ? rows : pricedDefaults;
  } catch (error) {
    console.error("Using bundled service content because Neon is unavailable.", error);
    return pricedDefaults;
  }
}

export async function getService(slug: string) {
  return (await getServices()).find((service) => service.slug === slug);
}

export async function getSiteSettings():Promise<SiteSettings>{if(!contentStoreIsConfigured())return defaultSiteSettings;try{const rows=await database().query(`select phone,email,whatsapp,address,legal_name as "legalName",registration_date as "registrationDate",cin,gst from public.site_settings where site_key=$1`,[siteKey]) as SiteSettings[];return rows[0]??defaultSiteSettings}catch(error){console.error("Using bundled contact details because Neon is unavailable.",error);return defaultSiteSettings}}
export async function saveSiteSettings(settings:SiteSettings){await database().query(`insert into public.site_settings(site_key,phone,email,whatsapp,address,legal_name,registration_date,cin,gst,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,now()) on conflict(site_key) do update set phone=excluded.phone,email=excluded.email,whatsapp=excluded.whatsapp,address=excluded.address,legal_name=excluded.legal_name,registration_date=excluded.registration_date,cin=excluded.cin,gst=excluded.gst,updated_at=now()`,[siteKey,settings.phone,settings.email,settings.whatsapp,settings.address,settings.legalName,settings.registrationDate,settings.cin,settings.gst])}

export async function saveServices(services: Service[]) {
  const payload = services.map((service, sort_order) => ({ ...service, sort_order }));
  const sql = database();
  await sql.transaction([
    sql.query(`delete from public.site_services where site_key = $1`, [siteKey]),
    sql.query(
      `insert into public.site_services (
       site_key, slug, title, category, short, intro,
       benefits, deliverables, price, packages, sort_order, updated_at
       )
       select
       $1, item.slug, item.title, item.category, item.short, item.intro,
       coalesce(item.benefits, '[]'::jsonb),
       coalesce(item.deliverables, '[]'::jsonb), coalesce(item.price,14999), coalesce(item.packages,'[]'::jsonb),
       coalesce(item.sort_order, 0), now()
       from jsonb_to_recordset($2::jsonb) as item(
       slug text, title text, category text, short text, intro text,
       benefits jsonb, deliverables jsonb, price integer, packages jsonb, sort_order integer
       )`,
      [siteKey, JSON.stringify(payload)],
    ),
  ]);
}
