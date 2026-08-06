import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantWidget from "@/components/AssistantWidget";
import ToastContainer from "@/components/Toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://textilehub.vercel.app";
const OG_IMAGE = "https://images.unsplash.com/photo-1615799998603-7c6270a45196?w=1200&h=630&q=80&auto=format&fit=crop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TextileHub | B2B Textile Marketplace",
    template: "%s | TextileHub",
  },
  description:
    "Source fabric and finished garments directly from verified textile suppliers. Compare pricing and MOQ, ask our AI sourcing assistant, and place bulk orders — all in one marketplace.",
  keywords: [
    "B2B textile marketplace",
    "wholesale fabric",
    "bulk fabric sourcing",
    "textile suppliers",
    "cotton fabric wholesale",
    "denim manufacturer",
    "MOQ fabric",
  ],
  openGraph: {
    title: "TextileHub | B2B Textile Marketplace",
    description:
      "Source fabric and finished garments directly from verified textile suppliers, with AI-assisted search and transparent bulk pricing.",
    url: SITE_URL,
    siteName: "TextileHub",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "TextileHub — B2B Textile Marketplace" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TextileHub | B2B Textile Marketplace",
    description: "Source fabric and finished garments directly from verified textile suppliers.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${jakarta.variable}`}>
      <body
        className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans antialiased"
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AssistantWidget />
        <ToastContainer />
      </body>
    </html>
  );
}
