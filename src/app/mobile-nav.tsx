"use client";

import Link from "next/link";
import { useState } from "react";

type MobileGroup = {
  title: string;
  services: { slug: string; title: string }[];
};

function categoryId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function MobileNav({ groups }: { groups: MobileGroup[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="nsx-mobile-menu">
      <button
        className="nsx-mobile-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="utilitech-mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        Menu <span aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
      <nav
        id="utilitech-mobile-navigation"
        className={open ? "is-open" : ""}
        aria-label="Mobile navigation"
      >
        <Link href="/" onClick={close}>Home</Link>
        <details>
          <summary>Services <span aria-hidden="true">＋</span></summary>
          <div>
            {groups.map((group) => (
              <section key={group.title}>
                <Link
                  className="nsx-dropdown-category"
                  href={`/services#${categoryId(group.title)}`}
                  onClick={close}
                >
                  {group.title}
                </Link>
                {group.services.map((service) => (
                  <Link href={`/services/${service.slug}`} key={service.slug} onClick={close}>
                    {service.title}
                  </Link>
                ))}
              </section>
            ))}
          </div>
        </details>
        <Link href="/about" onClick={close}>About us</Link>
        <Link href="/contact" onClick={close}>Contact</Link>
        <Link className="nsx-order-link" href="/checkout" onClick={close}>
          Order services <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </div>
  );
}
