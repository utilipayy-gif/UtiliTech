import type { MetadataRoute } from "next";
import { getServices } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://utilitech.in";
  const services = await getServices();
  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    ...services.map(({ slug }) => ({ url: `${base}/services/${slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
