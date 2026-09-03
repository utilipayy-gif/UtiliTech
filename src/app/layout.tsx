import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "UtiliTech",
  url: "https://utilitech.in",
  email: "utilipayhub@gmail.com",
  telephone: "+91-96531-27760",
  areaServed: "IN",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://utilitech.in",
  ),
  title: "UtiliTech — Web Design, Development & Digital Marketing",
  description:
    "Website design, development, digital marketing, applications, domains and hosting for growing businesses.",
  alternates: { canonical: "/" },
  icons: { icon: [{ url: "/logo-mark.svg", type: "image/svg+xml" }] },
  robots: { index: true, follow: true },
  openGraph: {
    title: "UtiliTech",
    description: "Connected web, application and digital growth services.",
    url: "/",
    siteName: "UtiliTech",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "UtiliTech" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UtiliTech",
    description: "Connected web, application and digital growth services.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
