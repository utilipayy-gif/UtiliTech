"use client";

import { FormEvent, useState } from "react";
import type { Service } from "../service-data";
import { servicePrice } from "../service-data";

type OrderOption = {
  key: string;
  serviceSlug: string;
  serviceTitle: string;
  category: string;
  packageId?: string;
  packageName?: string;
  heading?: string;
  price: number;
};

export default function CheckoutForm({
  services,
  initialService,
  initialPackage,
}: {
  services: Service[];
  initialService?: string;
  initialPackage?: string;
}) {
  const options: OrderOption[] = services.flatMap((service) =>
    service.packages?.length
      ? service.packages.map((item) => ({
          key: `${service.slug}::${item.id}`,
          serviceSlug: service.slug,
          serviceTitle: service.title,
          category: service.category,
          packageId: item.id,
          packageName: item.name,
          heading: item.heading,
          price: item.price,
        }))
      : [
          {
            key: service.slug,
            serviceSlug: service.slug,
            serviceTitle: service.title,
            category: service.category,
            price: servicePrice(service),
          },
        ],
  );
  const requested =
    options.find(
      (item) =>
        item.serviceSlug === initialService &&
        (!initialPackage || item.packageId === initialPackage),
    ) ?? options.find((item) => item.serviceSlug === initialService);
  const [items, setItems] = useState<Record<string, number>>(
    requested ? { [requested.key]: 1 } : {},
  );
  const [choice, setChoice] = useState(options[0]?.key ?? "");
  const [ready, setReady] = useState(false);
  const selected = options.filter((item) => items[item.key]);
  const total = selected.reduce(
    (sum, item) => sum + item.price * (items[item.key] ?? 0),
    0,
  );
  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  const update = (key: string, amount: number) =>
    setItems((current) => {
      const next = {
        ...current,
        [key]: Math.max(0, (current[key] ?? 0) + amount),
      };
      if (!next[key]) delete next[key];
      return next;
    });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReady(true);
  }

  return (
    <form className="order-builder" onSubmit={submit}>
      <div className="order-catalog">
        <div className="order-add">
          <label>
            Add a service or package
            <select value={choice} onChange={(event) => setChoice(event.target.value)}>
              {options.map((item) => (
                <option value={item.key} key={item.key}>
                  {item.serviceTitle}
                  {item.packageName ? ` — ${item.packageName}` : ""} —{" "}
                  {money(item.price)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => update(choice, 1)}>
            Add to order +
          </button>
        </div>
        {selected.length ? (
          <div className="order-items">
            {selected.map((item) => (
              <article key={item.key}>
                <div>
                  <span>{item.category}</span>
                  <h3>{item.serviceTitle}</h3>
                  {item.packageName && (
                    <strong className="order-package-name">{item.packageName}</strong>
                  )}
                  <p>{item.heading ?? `${money(item.price)} each`}</p>
                </div>
                <div className="order-quantity">
                  <button
                    type="button"
                    aria-label={`Remove one ${item.packageName ?? item.serviceTitle}`}
                    onClick={() => update(item.key, -1)}
                  >
                    −
                  </button>
                  <strong>{items[item.key]}</strong>
                  <button
                    type="button"
                    aria-label={`Add one ${item.packageName ?? item.serviceTitle}`}
                    onClick={() => update(item.key, 1)}
                  >
                    +
                  </button>
                </div>
                <b>{money(item.price * (items[item.key] ?? 0))}</b>
              </article>
            ))}
          </div>
        ) : (
          <div className="order-empty">
            <strong>Your order is empty.</strong>
            <p>Select a service or package above to start building it.</p>
          </div>
        )}
      </div>
      <aside className="order-summary">
        <span>YOUR ORDER</span>
        <h2>Project details</h2>
        <label>
          Full name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Phone / WhatsApp
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
        <label>
          Business name
          <input name="business" autoComplete="organization" />
        </label>
        <label>
          Anything we should know?
          <textarea name="notes" rows={3} />
        </label>
        <div className="order-total">
          <span>Estimated total</span>
          <strong>{money(total)}</strong>
          <small>Final scope and applicable taxes are confirmed before payment.</small>
        </div>
        <button className="button button-primary" disabled={!selected.length}>
          Proceed to payment →
        </button>
        {ready && (
          <p className="order-ready" role="status">
            <strong>Your order is ready.</strong> Secure gateway processing can now
            be connected to this confirmed package selection.
          </p>
        )}
      </aside>
    </form>
  );
}
