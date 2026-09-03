import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/content-store";

type LegalShellProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export default async function LegalShell({ title, intro, children }: LegalShellProps) {
  const settings=await getSiteSettings();
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="brand" href="/" aria-label="UtiliTech home">
          <Image className="brand-logo" src="/logo-mark.svg" alt="" width={34} height={34} priority />
          <span>UTILITECH</span>
        </Link>
        <Link className="legal-home-link" href="/">Back to website <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="legal-hero">
        <span className="section-kicker">Legal / utilitech.in</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="legal-meta"><span>Effective 1 September 2026</span><span>Last updated 1 September 2026</span></div>
      </section>

      <div className="legal-layout">
        <aside className="legal-nav" aria-label="Legal pages">
          <span>Legal documents</span>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/refund">Refund &amp; Cancellation Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/shipping">Shipping Policy</Link>
          <a href={`mailto:${settings.email}`}>Privacy contact ↗</a>
        </aside>
        <article className="legal-content">{children}</article>
      </div>

      <footer className="legal-footer">
        <div><strong>Address</strong><span>{settings.address}</span><a href={`mailto:${settings.email}`}>{settings.email}</a></div>
        <div><span>© 2026 UtiliTech</span><Link href="/privacy">Privacy</Link><Link href="/refund">Refunds</Link><Link href="/terms">Terms</Link><Link href="/shipping">Shipping</Link></div>
      </footer>
    </main>
  );
}
