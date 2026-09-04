import Image from "next/image";
import Link from "next/link";
import { serviceGroups,type Service } from "./service-data";
import { getSiteSettings } from "@/lib/content-store";
import MobileNav from "./mobile-nav";

export function categoryId(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function groupServices(all:Service[]){const known=new Set<string>(serviceGroups.map(group=>group.title));return [...serviceGroups.map(group=>({...group,services:all.filter(service=>service.category===group.title)})),...Array.from(new Set(all.filter(service=>!known.has(service.category)).map(service=>service.category))).map((title,index)=>({number:String(serviceGroups.length+index+1).padStart(2,"0"),title,description:"Additional specialist services configured for your business.",services:all.filter(service=>service.category===title)}))].filter(group=>group.services.length)}

export function UtiliHeader({services}:{services:Service[]}){
  const groups=groupServices(services);
  return <header className="nsx-header" id="top">
    <Link className="brand" href="/"><Image className="brand-logo" src="/logo-mark.svg" alt="" width={34} height={34} priority/><span>UTILITECH</span></Link>
    <nav className="nsx-nav" aria-label="Primary navigation">
      <div className="nsx-services-menu"><Link href="/services">Services <span className="nsx-menu-toggle" aria-hidden="true">+</span></Link><div className="nsx-services-dropdown">{groups.map(group=><section key={group.title}><Link className="nsx-dropdown-category" href={`/services#${categoryId(group.title)}`}>{group.title}</Link>{group.services.map(service=><Link href={`/services/${service.slug}`} key={service.slug}>{service.title}</Link>)}</section>)}</div></div>
      <Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link className="nsx-order-link" href="/checkout">Order services <span aria-hidden="true">↗</span></Link>
    </nav>
    <MobileNav groups={groups}/>
    <Link className="nsx-head-cta" href="/checkout">Start an order <span>↗</span></Link>
  </header>
}

export async function UtiliFooter(){const settings=await getSiteSettings();return <><footer className="nsx-footer"><div><Link className="brand" href="/"><Image className="brand-logo" src="/logo-mark.svg" alt="" width={34} height={34}/><span>UTILITECH</span></Link><p>Web, application and digital growth services for ambitious teams.</p><small>{settings.address}</small></div><div><b>EXPLORE</b><Link href="/services">Services</Link><Link href="/checkout">Order services</Link><Link href="/about">About us</Link><Link href="/contact">Contact</Link></div><div><b>LEGAL</b><Link href="/privacy">Privacy</Link><Link href="/refund">Refund &amp; cancellation</Link><Link href="/terms">Terms &amp; conditions</Link><Link href="/shipping">Shipping policy</Link></div><small>© 2026 UtiliTech · utilitech.in</small></footer><a className="nsx-whatsapp" href={`https://wa.me/${settings.whatsapp}?text=Hi%20UtiliTech%2C%20I%27d%20like%20to%20discuss%20a%20digital%20project.`} target="_blank" rel="noopener noreferrer"><span>●</span> WhatsApp</a></>}
