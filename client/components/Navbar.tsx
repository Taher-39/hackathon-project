"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShoppingCart, LogOut, Heart, Shirt } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore, useCartStore, useWishlistStore } from "@/lib/store";
import NotificationBell from "@/components/NotificationBell";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className="relative text-sm text-gray-700 hover:text-indigo-700 transition-colors py-1">
      {children}
      <span
        className={`absolute left-0 -bottom-0.5 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 ${
          active ? "w-full" : "w-0"
        }`}
      />
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    api.post("/auth/logout").catch(() => {});
    logout();
    router.push("/login");
  }

  const dashboardHref =
    user?.role === "supplier" ? "/dashboard/supplier" : user?.role === "admin" ? "/dashboard/admin" : "/dashboard/buyer";

  return (
    <nav
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b transition-shadow ${
        scrolled ? "border-gray-200 shadow-sm" : "border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-lg font-bold text-indigo-700 group">
            <Shirt size={20} className="text-indigo-600 transition-transform group-hover:-rotate-6" />
            TextileHub
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/">Marketplace</NavLink>
            {user?.role === "buyer" && (
              <Link href="/wishlist" className="relative text-sm text-gray-700 hover:text-indigo-700 transition-colors">
                <span className="inline-flex items-center gap-1">
                  <Heart size={16} /> Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full px-1.5">{wishlistCount}</span>
                  )}
                </span>
              </Link>
            )}
            {user?.role === "buyer" && (
              <Link href="/cart" className="relative text-sm text-gray-700 hover:text-indigo-700 transition-colors">
                <span className="inline-flex items-center gap-1">
                  <ShoppingCart size={16} /> Cart
                  {cartCount > 0 && (
                    <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full px-1.5">{cartCount}</span>
                  )}
                </span>
              </Link>
            )}
            {user && <NavLink href={dashboardHref}>Dashboard</NavLink>}
            {user && <NotificationBell />}
            {user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-700 hover:text-indigo-700 transition-colors">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-indigo-600 text-white px-3.5 py-1.5 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 flex flex-col gap-3">
                <Link href="/" onClick={() => setOpen(false)} className="text-sm text-gray-700">
                  Marketplace
                </Link>
                {user?.role === "buyer" && (
                  <Link href="/wishlist" onClick={() => setOpen(false)} className="text-sm text-gray-700">
                    Wishlist ({wishlistCount})
                  </Link>
                )}
                {user?.role === "buyer" && (
                  <Link href="/cart" onClick={() => setOpen(false)} className="text-sm text-gray-700">
                    Cart ({cartCount})
                  </Link>
                )}
                {user && (
                  <Link href={dashboardHref} onClick={() => setOpen(false)} className="text-sm text-gray-700">
                    Dashboard
                  </Link>
                )}
                {user && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    Notifications
                    <NotificationBell />
                  </div>
                )}
                {user ? (
                  <button onClick={handleLogout} className="text-left text-sm text-red-600">
                    Logout
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-gray-700">
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="text-sm text-indigo-700 font-medium"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
