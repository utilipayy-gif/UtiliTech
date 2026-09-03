import type { Metadata } from "next";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions — UtiliTech",
  description: "Terms governing use of the UtiliTech website and service enquiries.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms & Conditions — UtiliTech", description: "Website and enquiry terms for UtiliTech.", url: "/terms", images: [] },
  twitter: { title: "Terms & Conditions — UtiliTech", description: "Website and enquiry terms for UtiliTech.", images: [] },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" intro="These terms govern your use of utilitech.in and any enquiry you submit through it. A signed proposal or service agreement will contain the final commercial terms for an actual project.">
      <section><h2>1. Acceptance</h2><p>By accessing or using <a href="https://utilitech.in">utilitech.in</a>, you agree to these Terms &amp; Conditions and our <a href="/privacy">Privacy Policy</a>. If you do not agree, please do not use the website.</p></section>
      <section><h2>2. About the website</h2><p>The website introduces UtiliTech&apos;s website-design, software and business-system services. Content is provided for general information and may be changed, corrected or withdrawn without notice. It is not professional, legal, tax, accounting or financial advice.</p></section>
      <section><h2>3. Enquiries are not contracts</h2><p>Submitting a form, sending a WhatsApp message, arranging a call or receiving an initial response does not create a client relationship or require either party to proceed. A project begins only when scope, fees, timelines, responsibilities and payment terms are confirmed in writing and any required advance is received.</p></section>
      <section><h2>4. Proposals and service agreements</h2><p>Each project may be governed by a written proposal, statement of work, invoice or service agreement. If those project terms conflict with these website terms, the signed or expressly accepted project terms control for that project.</p></section>
      <section><h2>5. Prices, taxes and third-party costs</h2><p>Website prices describe the stated package and may change before a proposal is accepted. Final pricing depends on confirmed scope. Taxes, domain registration, hosting, paid software, payment gateways, stock assets, messaging charges and other third-party costs are excluded unless the proposal expressly includes them.</p></section>
      <section><h2>6. Payments</h2><p>Payment schedules, accepted methods, due dates, refunds and consequences of delay are stated in the applicable proposal or invoice. We may pause work or withhold launch, handover or licence rights where an undisputed amount is overdue. No payment gateway is currently operated on this website.</p></section>
      <section><h2>7. Client responsibilities</h2><p>Clients are responsible for providing accurate instructions, lawful content, timely feedback and access needed to complete the work. You confirm that you own or have permission to use material you supply, including logos, photographs, text, customer data and trademarks. Delays in inputs or approvals may change the delivery schedule.</p></section>
      <section><h2>8. Intellectual property</h2><p>UtiliTech and its licensors retain rights in the website, brand, processes, reusable tools, know-how, pre-existing code and third-party material. Ownership or licence terms for client deliverables will be stated in the project agreement. Unless agreed otherwise, transfer of agreed custom deliverables occurs only after full payment, while third-party and reusable components remain subject to their own licences.</p></section>
      <section><h2>9. Third-party services</h2><p>Domains, hosting, analytics, messaging, payment providers, social platforms, APIs and other third-party services have separate terms, fees and availability. We may help configure them but do not control their uptime, policies, account decisions, price changes or data handling.</p></section>
      <section><h2>10. Acceptable use</h2><p>You must not misuse the website, attempt unauthorised access, interfere with its operation, introduce malicious code, scrape it unreasonably, impersonate another person, infringe rights or use it for unlawful, fraudulent or abusive activity.</p></section>
      <section><h2>11. No guaranteed business outcome</h2><p>We aim to deliver the agreed work professionally, but do not guarantee search rankings, traffic, sales, revenue, regulatory approval or any particular commercial result. Examples, estimates and case-study outcomes are contextual and may not be typical for every business.</p></section>
      <section><h2>12. Availability and warranties</h2><p>The public website is provided on an “as available” basis. To the maximum extent permitted by law, we disclaim implied warranties relating to uninterrupted access, error-free operation and fitness for a purpose not expressly agreed in a project contract. Nothing in these terms excludes a warranty or right that cannot lawfully be excluded.</p></section>
      <section><h2>13. Limitation of liability</h2><p>To the maximum extent permitted by law, UtiliTech will not be liable for indirect, incidental, special or consequential loss arising from use of this public website or reliance on its general content. Any liability relating to paid services will be governed by the relevant project agreement. Nothing limits liability that cannot legally be limited.</p></section>
      <section><h2>14. Governing law and disputes</h2><p>These website terms are governed by the laws of India. The parties should first attempt to resolve a concern in good faith. Subject to any binding project agreement, disputes will be submitted to courts of competent jurisdiction in India.</p></section>
      <section><h2>15. Changes and contact</h2><p>We may update these terms by publishing a revised version on this page. Continued use after publication means the revised website terms apply from their effective date. Questions may be sent to <a href="mailto:utilipayhub@gmail.com">utilipayhub@gmail.com</a> or <a href="tel:+919653127760">+91 96531 27760</a>.</p></section>
    </LegalShell>
  );
}
