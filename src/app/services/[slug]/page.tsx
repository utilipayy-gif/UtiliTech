import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, getServices } from "@/lib/content-store";
import { formatPrice } from "@/app/service-data";
import { UtiliFooter, UtiliHeader } from "@/app/site-chrome";
import { ServicePackages } from "@/app/service-packages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = await getService((await params).slug);
  return service ? { title: `${service.title} | UtiliTech`, description: service.short } : {};
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const allServices = await getServices();
  const { slug } = await params;
  const service = allServices.find((item) => item.slug === slug);
  if (!service) notFound();
  const hasPackages = Boolean(service.packages?.length);
  const related = allServices.filter((item) => item.category === service.category && item.slug !== service.slug).slice(0, 3);

  return <main className="nsx-site">
    <UtiliHeader services={allServices} />
    <section className="nsx-service-hero">
      <div>
        <span className="nsx-label">SERVICES / {service.category.toUpperCase()}</span>
        <h1>{service.title}</h1>
        <p>{service.short}</p>
        <div className="service-price">
          <span>{hasPackages ? "Packages from" : "Starting at"}</span>
          <strong>{formatPrice(service)}</strong>
          <small>{hasPackages ? `${service.packages?.length} packages available.` : "Final price depends on confirmed scope."}</small>
        </div>
        <div className="nsx-actions">
          <Link className="button button-primary" href={hasPackages ? "#packages" : `/checkout?service=${service.slug}`}>
            {hasPackages ? "Compare packages" : "Order this service"} →
          </Link>
          <Link className="button button-ghost" href="/contact">Ask a question</Link>
        </div>
      </div>
      <div className="nsx-service-console">
        <div><span>UTILITECH / SERVICE</span><b>● READY</b></div><small>{service.category}</small><strong>{service.title}</strong>
        <div className="nsx-console-lines"><i /><i /><i /><i /><i /></div><p>STRATEGY → BUILD → LAUNCH</p>
      </div>
    </section>
    <section className="nsx-section nsx-overview">
      <div><span className="nsx-label">01 / OVERVIEW</span><h2>Built around the <em>outcome.</em></h2></div>
      <div><p>{service.intro}</p><h3>WHAT THIS HELPS YOU ACHIEVE</h3>{service.benefits.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</article>)}</div>
    </section>
    <ServicePackages service={service} />
    <section className="nsx-popular">
      <div className="nsx-section">
        <div className="nsx-heading"><div><span className="nsx-label">{hasPackages ? "03" : "02"} / DELIVERABLES</span><h2>A clear path to <em>launch.</em></h2></div><p>Every engagement is shaped to the business, but the important stages always stay visible.</p></div>
        <div className="nsx-deliverables">{service.deliverables.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item}</h3><p>Planned, reviewed and delivered around your audience and goals.</p></article>)}</div>
      </div>
    </section>
    <section className="nsx-section">
      <div className="nsx-heading"><div><span className="nsx-label">{hasPackages ? "04" : "03"} / RELATED</span><h2>Useful services to <em>connect.</em></h2></div></div>
      <div className="nsx-related">{related.map((item) => <Link href={`/services/${item.slug}`} key={item.slug}><span>{item.category}</span><h3>{item.title}</h3><p>{item.short}</p><b>Explore <i>↗</i></b></Link>)}</div>
    </section>
    <section className="nsx-conversion">
      <div>
        <span>READY WHEN YOU ARE</span>
        <h2>{hasPackages ? "Build your package and review the total." : "Ready to order this service?"}</h2>
        <p>{hasPackages ? "Select the exact package you need, combine other services and continue to the payment-ready checkout." : "Add this service to your order, share your details and review the total before payment."}</p>
      </div>
      <Link className="button button-primary" href={`/checkout?service=${service.slug}`}>{hasPackages ? "Start your order" : "Order this service"} →</Link>
    </section>
    <UtiliFooter />
  </main>;
}
