import Link from "next/link";
import { Search, ShieldCheck, Sparkles, PackageCheck, Users2, Factory } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

export const metadata = { title: "About Us | TextileHub" };

const STEPS = [
  {
    icon: Users2,
    title: "Register & onboard",
    desc: "Sign up as a buyer or supplier and complete a quick profile — categories, fabrics, and order preferences.",
  },
  {
    icon: Search,
    title: "Discover & compare",
    desc: "Search live inventory, filter by category and price, and let the AI assistant shortlist real matches.",
  },
  {
    icon: PackageCheck,
    title: "Order & track",
    desc: "Place bulk orders with transparent MOQ and pricing, then track status from pending to delivered.",
  },
];

const STATS = [
  { value: "5+", label: "Fabric categories" },
  { value: "2", label: "Roles: buyer & supplier" },
  { value: "24/7", label: "AI sourcing assistant" },
  { value: "0", label: "Cold-call phone chases" },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Our story
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Built to make textile sourcing simple</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto">
            TextileHub connects textile buyers — retailers, brands, and manufacturers — directly with verified
            fabric suppliers, replacing scattered phone calls and catalogs with one transparent marketplace.
          </p>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Our mission</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">A single home for buyers and suppliers</h2>
          <p className="text-gray-600 mb-4">
            Suppliers get a storefront to list their catalog, manage incoming orders, and track performance.
            Buyers get transparent pricing, minimum order quantities, and an AI assistant that finds the right
            fabric without wading through irrelevant listings.
          </p>
          <p className="text-gray-600 mb-6">
            This project was built as a hackathon prototype demonstrating the core marketplace workflow
            end-to-end — from registration and onboarding to discovery, checkout, order management, and
            supplier analytics.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1594734415578-00fc9540929b?w=1000&h=800&q=80&auto=format&fit=crop"
              alt="Woven cotton fabric texture"
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-white border-y">
        <RevealGroup className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <RevealItem key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <Reveal className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold mb-2">How it works</h2>
          <p className="text-gray-500 text-sm">Three steps from account to fulfilled order.</p>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <RevealItem key={title}>
              <div className="h-full border rounded-xl bg-white p-6 relative hover:shadow-lg hover:border-indigo-200 transition-shadow">
                <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                  {i + 1}
                </span>
                <div className="bg-indigo-50 text-indigo-600 rounded-lg p-2.5 inline-flex mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: "Verified suppliers", desc: "Trusted, established mills carry a verified badge." },
            { icon: Sparkles, title: "AI-assisted search", desc: "Describe what you need in plain language and get real matches." },
            { icon: Factory, title: "Built for bulk", desc: "MOQ and stock are visible upfront on every listing." },
          ].map(({ icon: Icon, title, desc }) => (
            <RevealItem key={title}>
              <div className="flex items-start gap-3">
                <Icon size={22} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}
