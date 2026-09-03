export type Service = { slug:string; title:string; category:string; short:string; intro:string; benefits:string[]; deliverables:string[] };

const raw: Array<[string,string,string,string]> = [
  ["website-design","Website Design","Design & Development","Custom visual design that makes your business clear, credible and memorable."],
  ["website-development","Website Development","Design & Development","Fast, secure websites engineered to perform reliably across modern devices."],
  ["responsive-websites","Responsive Website Design","Design & Development","One consistent experience across mobiles, tablets, laptops and large screens."],
  ["logo-design","Logo & Visual Identity","Design & Development","A recognisable identity with the practical assets needed to use it consistently."],
  ["website-redesign","Website Redesign","Design & Development","A clearer, faster and more current website without losing what already works."],
  ["website-maintenance","Website Maintenance","Design & Development","Ongoing updates, monitoring and fixes that keep your site dependable."],
  ["corporate-websites","Corporate Website Design","Design & Development","Structured company websites that communicate capability, trust and scale."],
  ["blog-websites","Blog & Publication Websites","Design & Development","Readable, searchable publishing experiences built for growing content."],
  ["seo","Search Engine Optimisation","Internet Marketing","Technical and content improvements that help useful pages earn visibility."],
  ["ppc-management","Pay Per Click Management","Internet Marketing","Focused paid campaigns designed around qualified visits and measurable spend."],
  ["social-media","Social Media Marketing","Internet Marketing","A consistent social presence shaped for attention, trust and action."],
  ["email-marketing","Email Marketing","Internet Marketing","Useful email journeys that welcome, nurture and bring customers back."],
  ["custom-web-applications","Custom Web Applications","Application Development","Purpose-built web tools that match the way your team or customers work."],
  ["content-management-systems","Content Management Systems","Application Development","Simple publishing and content controls tailored to your team."],
  ["school-management-systems","School Management Systems","Application Development","Connected tools for student records, fees, communication and administration."],
  ["mobile-applications","Mobile Application Development","Application Development","Focused mobile products designed for tasks users need on the move."],
  ["ecommerce-websites","E-commerce Websites","Application Development","Product discovery and checkout experiences that make buying straightforward."],
  ["motion-presentations","Motion Presentations","Creative & Multimedia","Modern motion-led presentations that explain ideas with clarity and energy."],
  ["interactive-web-experiences","Interactive Web Experiences","Creative & Multimedia","Purposeful web interactions that add context, delight and understanding."],
  ["digital-advertising-creative","Digital Advertising Creative","Creative & Multimedia","Flexible campaign assets that stay recognisable across every channel."],
  ["domain-registration","Domain Registration","Domain & Hosting","Help choosing, registering and organising the right domain under your ownership."],
  ["web-hosting","Web Hosting","Domain & Hosting","Reliable hosting selected and configured for the website you actually run."],
  ["ssl-certificates","SSL Certificates","Domain & Hosting","Secure HTTPS configuration that protects visitors and strengthens trust."],
];

const detailByCategory: Record<string,{intro:string;benefits:string[];deliverables:string[]}> = {
  "Design & Development": { intro:"A strong website makes the business easy to understand and easy to choose. We combine original design, responsive development and clear customer journeys, then test every important detail before launch.", benefits:["A credible and distinctive digital presence","Simple journeys on every screen","A maintainable foundation built to grow"], deliverables:["Discovery & planning","Custom design","Responsive development","Testing & launch"] },
  "Internet Marketing": { intro:"Visibility matters only when it reaches the right audience. We connect useful content, focused campaigns and honest measurement so marketing activity can support clear business outcomes.", benefits:["More relevant traffic and enquiries","Campaign decisions backed by evidence","A consistent presence across channels"], deliverables:["Audience research","Campaign strategy","Creative & setup","Measurement & optimisation"] },
  "Application Development": { intro:"Generic tools can force a business into the wrong process. We map the exact job, design a focused workflow and build scalable software around the people who will actually use it.", benefits:["Less repeated work and manual error","A workflow shaped to the business","Room for integrations and future features"], deliverables:["Workflow discovery","Product UX/UI","Secure development","Training & handover"] },
  "Creative & Multimedia": { intro:"Modern motion and interaction can make a complex idea easier to understand and remember. We create purposeful visual experiences that work across current browsers, formats and devices.", benefits:["Clearer, more engaging stories","A distinctive digital impression","Reusable creative across campaigns"], deliverables:["Creative direction","Storyboarding","Motion & interaction","Multi-format delivery"] },
  "Domain & Hosting": { intro:"Domains, hosting and security form the quiet foundation of every reliable website. We configure the right setup, keep ownership clear and document renewals so there are no avoidable surprises.", benefits:["Reliable website availability","Clear account ownership and renewals","Secure, correctly configured foundations"], deliverables:["Setup consultation","Domain & DNS","Hosting or migration","SSL & monitoring"] },
};

export const services: Service[] = raw.map(([slug,title,category,short]) => ({ slug,title,category,short,...detailByCategory[category] }));
export const serviceBySlug = Object.fromEntries(services.map((service)=>[service.slug,service])) as Record<string,Service>;
export const serviceGroups = [
  {number:"01",title:"Design & Development",description:"Distinctive, responsive websites designed around your business and the actions customers should take.",services:["website-design","website-development","responsive-websites","logo-design","website-redesign","website-maintenance","corporate-websites","blog-websites"]},
  {number:"02",title:"Internet Marketing",description:"Practical campaigns that help the right people discover, understand and return to your business.",services:["seo","ppc-management","social-media","email-marketing"]},
  {number:"03",title:"Application Development",description:"Custom products and management tools shaped around your real workflow—not generic software.",services:["custom-web-applications","content-management-systems","school-management-systems","mobile-applications","ecommerce-websites"]},
  {number:"04",title:"Creative & Multimedia",description:"Motion, interactive presentations and campaign creative that make ideas easier to remember.",services:["motion-presentations","interactive-web-experiences","digital-advertising-creative"]},
  {number:"05",title:"Domain & Hosting",description:"Domain, hosting and SSL setup with dependable support, clear ownership and room to grow.",services:["domain-registration","web-hosting","ssl-certificates"]},
];
