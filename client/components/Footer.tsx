import Link from "next/link";
import { Shirt, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gray-900 text-gray-300 mt-auto">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <Shirt size={20} className="text-indigo-400" /> TextileHub
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            A B2B marketplace connecting textile buyers and suppliers — discover fabrics, negotiate bulk orders,
            and manage the whole sourcing journey in one place.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase text-xs text-gray-400">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-white transition-colors">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-white transition-colors">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white transition-colors">
                Become a Supplier
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-xs text-gray-400">Company</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-xs text-gray-400">Contact</h3>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-indigo-400 shrink-0" /> support@textilehub.com
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-indigo-400 shrink-0" /> +880-1700-000000
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-indigo-400 shrink-0" /> Dhaka, Bangladesh
            </li>
            <li className="pt-1">
              <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Send us a message →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} TextileHub. All rights reserved.
      </div>
    </footer>
  );
}
