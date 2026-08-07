"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, MapPin, Lock, Package, ClipboardList, FileText, UserRound } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const BUYER_NAV: NavItem[] = [
  { href: "/dashboard/buyer", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/buyer/quotes", label: "Quote Requests", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/buyer/address", label: "Address", icon: MapPin },
  { href: "/dashboard/security", label: "Security", icon: Lock },
];

const SUPPLIER_NAV: NavItem[] = [
  { href: "/dashboard/supplier", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/supplier/products", label: "Products", icon: Package },
  { href: "/dashboard/supplier/orders", label: "Orders", icon: ClipboardList },
  { href: "/dashboard/supplier/quotes", label: "Quote Requests", icon: FileText },
  { href: "/dashboard/profile", label: "Business Profile", icon: UserRound },
  { href: "/dashboard/security", label: "Security", icon: Lock },
];

export function DesktopSidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const items = user?.role === "supplier" ? SUPPLIER_NAV : BUYER_NAV;

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="sticky top-20 border rounded-xl bg-white p-2 space-y-1 shadow-sm">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-indigo-50 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={16} className={`relative ${active ? "text-indigo-600" : "text-gray-400"}`} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileTabs() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const items = user?.role === "supplier" ? SUPPLIER_NAV : BUYER_NAV;

  return (
    <nav className="md:hidden -mx-4 px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active ? "text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="mobile-active-pill"
                className="absolute inset-0 bg-indigo-600 rounded-full -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={14} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
