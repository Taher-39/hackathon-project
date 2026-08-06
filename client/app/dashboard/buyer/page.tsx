"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch,
  ShoppingBag,
  ClipboardList,
  Clock,
  CheckCircle2,
  Wallet,
  Heart,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useAssistantStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderStatusStepper from "@/components/OrderStatusStepper";
import DashboardLayout from "@/components/DashboardLayout";
import SpendChart from "@/components/SpendChart";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const ORDERS_PAGE_SIZE = 10;

interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number; size?: string }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface BuyerStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
  wishlistCount: number;
  openQuotes: number;
  spendPerMonth: { label: string; spend: number }[];
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Accepted: "bg-blue-100 text-blue-800",
  Preparing: "bg-purple-100 text-purple-800",
  "Ready for Dispatch": "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
};

const TILES = [
  { key: "totalOrders" as const, label: "Total Orders", icon: ClipboardList, color: "text-indigo-600 bg-indigo-50" },
  { key: "activeOrders" as const, label: "In Progress", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  { key: "completedOrders" as const, label: "Completed", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  { key: "wishlistCount" as const, label: "Wishlist Items", icon: Heart, color: "text-rose-600 bg-rose-50" },
  { key: "openQuotes" as const, label: "Open Quotes", icon: FileText, color: "text-purple-600 bg-purple-50" },
];

function BuyerDashboardContent() {
  const { user } = useAuthStore();
  const setAssistantOpen = useAssistantStore((s) => s.setOpen);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    api
      .get("/orders/mine", { params: { page, limit: ORDERS_PAGE_SIZE } })
      .then((res) => {
        setOrders((prev) => (page === 1 ? res.data.data.orders : [...prev, ...res.data.data.orders]));
        setPages(res.data.data.pages || 1);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [page]);

  useEffect(() => {
    api
      .get("/dashboard/buyer")
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  function loadMoreOrders() {
    if (loading || loadingMore || page >= pages) return;
    setPage((p) => p + 1);
  }

  const sentinelRef = useInfiniteScroll(loadMoreOrders, !loading && page < pages);

  return (
    <>
      <Reveal>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-600 text-white p-6 mb-6">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
              <p className="text-indigo-100 text-sm">{user?.email}</p>
              {user?.buyerProfile && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {user.buyerProfile.businessType && (
                    <span className="bg-white/10 border border-white/10 rounded-full px-3 py-1">
                      {user.buyerProfile.businessType}
                    </span>
                  )}
                  {user.buyerProfile.industry && (
                    <span className="bg-white/10 border border-white/10 rounded-full px-3 py-1">
                      {user.buyerProfile.industry}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:border-l sm:border-white/20 sm:pl-6">
              <Wallet size={20} className="text-indigo-200" />
              <div>
                <p className="text-2xl font-bold">${(stats?.totalSpent ?? 0).toLocaleString()}</p>
                <p className="text-xs text-indigo-200">Total spent</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {stats && (
        <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {TILES.map(({ key, label, icon: Icon, color }) => (
            <RevealItem key={key}>
              <motion.div
                whileHover={{ y: -3 }}
                className="border rounded-xl bg-white p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <span className={`rounded-lg p-2.5 ${color}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <AnimatedCounter value={stats[key]} className="text-xl font-bold" />
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      <Reveal>
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <ShoppingBag size={16} /> Browse Marketplace
          </Link>
          <Link
            href="/wishlist"
            className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Heart size={16} /> My Wishlist
          </Link>
          <Link
            href="/dashboard/buyer/quotes"
            className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <FileText size={16} /> My Quote Requests
          </Link>
          <button
            onClick={() => setAssistantOpen(true)}
            className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Sparkles size={16} className="text-indigo-600" /> Ask AI Assistant
          </button>
        </div>
      </Reveal>

      {stats && stats.totalOrders > 0 && (
        <Reveal>
          <div className="border rounded-xl bg-white p-4 mb-8 shadow-sm">
            <h2 className="text-lg font-bold mb-3">Spend (last 6 months)</h2>
            <SpendChart data={stats.spendPerMonth} />
          </div>
        </Reveal>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My Orders</h2>
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Browse marketplace →
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <div className="border rounded-xl bg-white p-10 text-center">
          <PackageSearch size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No orders yet. Start browsing the marketplace!</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ShoppingBag size={16} /> Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="border rounded-xl bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-medium">Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{new Date(order.createdAt).toLocaleString()}</p>
                <OrderStatusStepper status={order.status} />
                <ul className="text-sm text-gray-700 mb-2">
                  {order.items.map((item, j) => (
                    <li key={j}>
                      {item.name}
                      {item.size ? ` (${item.size})` : ""} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="font-bold">${order.totalAmount.toFixed(2)}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {page < pages && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" /> Loading more orders...
                </span>
              )}
            </div>
          )}
          {page >= pages && orders.length > ORDERS_PAGE_SIZE && (
            <p className="text-center text-sm text-gray-400 py-6">You&apos;ve reached the end of your orders.</p>
          )}
        </div>
      )}
    </>
  );
}

export default function BuyerDashboardPage() {
  return (
    <ProtectedRoute role="buyer">
      <DashboardLayout>
        <BuyerDashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
