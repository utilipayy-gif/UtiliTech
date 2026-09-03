import type { Metadata } from "next";
import { getServices } from "@/lib/content-store";
import { UtiliFooter,UtiliHeader } from "../site-chrome";
import CheckoutForm from "./checkout-form";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Choose a Service Package | UtiliTech",description:"Build your UtiliTech service package and prepare for secure payment."};
export default async function CheckoutPage({searchParams}:PageProps<"/checkout">){const services=await getServices(),query=await searchParams;const initial=typeof query.service==="string"&&services.some(item=>item.slug===query.service)?query.service:undefined;return <main className="nsx-site"><UtiliHeader services={services}/><section className="nsx-page-hero nsx-page-hero-short"><span className="nsx-label">ORDER / BUILD YOUR PACKAGE</span><h1>Choose what you need. See the price <em>clearly.</em></h1><p>Add one or more services, enter your details and review the total before secure payment.</p></section><section className="nsx-section nsx-order-page"><div className="order-steps"><span><b>01</b> Choose services</span><span><b>02</b> Add your details</span><span><b>03</b> Secure payment</span></div><CheckoutForm services={services} initial={initial}/></section><UtiliFooter/></main>}
