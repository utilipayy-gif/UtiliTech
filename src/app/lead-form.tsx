"use client";

import { FormEvent, useState } from "react";

export default function LeadForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const business = String(form.get("business") ?? "").trim();
    const service = String(form.get("service") ?? "Not sure yet");
    const message = String(form.get("message") ?? "").trim();
    const text = [
      `Hi UtiliTech, I’m ${name}.`,
      business ? `Business: ${business}.` : "",
      `I’m interested in: ${service}.`,
      message ? `A little more context: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/919653127760?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Your name <span>*</span>
          <input name="name" autoComplete="name" required placeholder="Your name" />
        </label>
        <label>
          Business name
          <input name="business" autoComplete="organization" placeholder="Company or brand" />
        </label>
      </div>
      <label>
        What do you need?
        <select name="service" defaultValue="Website design and development">
          <option>Website design and development</option>
          <option>SEO or digital marketing</option>
          <option>Custom web or mobile application</option>
          <option>E-commerce website</option>
          <option>Domain, hosting or maintenance</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <label>
        Tell us a little more
        <textarea name="message" rows={4} placeholder="What would you like to improve?" />
      </label>
      <button className="button button-primary form-submit" type="submit">
        Continue on WhatsApp <span aria-hidden="true">↗</span>
      </button>
      <p className="form-note" aria-live="polite">
        {sent
          ? "Your message is ready in WhatsApp — review it and press send when you’re happy."
          : "Your details stay on this device until you choose to send the message in WhatsApp."}
      </p>
    </form>
  );
}
