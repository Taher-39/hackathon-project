"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, CheckCircle, Clock, AlertTriangle, ArrowRight, Flame, FileText, TrendingUp } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import VerifiedBadge from "@/components/VerifiedBadge";
import OrdersChart from "@/components/OrdersChart";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

interface TopProduct {
  _id: string;
  name: string;
  price: number;
  totalSold: number;
  images: { url: string }[];
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  pendingQuotes: number;
  inventoryAlerts: number;
  recentOrders: { _id: string; totalAmount: number; status: string; createdAt: string }[];
  ordersPerWeek: { weekStart: string; orders: number; revenue: number }[];
}

const TILES = [
  { key: "totalProducts" as const, label: "Total Products", icon: Package, color: "text-indigo-600 bg-indigo-50" },
  { key: "activeProducts" as const, label: "Active Products", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  { key: "pendingOrders" as const, label: "Pending Orders", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  { key: "pendingQuotes" as const, label: "Quote Requests", icon: FileText, color: "text-purple-600 bg-purple-50" },
  { key: "inventoryAlerts" as const, label: "Low Stock Alerts", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
];

function SupplierDashboardContent() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/supplier")
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(apiErrorMessage(err)));

    if (user?._id) {
      api
        .get("/products/best-sellers", { params: { supplierId: user._id, limit: 5 } })
        .then((res) => setTopProducts(res.data.data.products))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const revenue8Weeks = stats?.ordersPerWeek?.reduce((sum, w) => sum + w.revenue, 0) ?? 0;

  return (
    <>
      <Reveal>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-600 text-white p-6 mb-6">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                {user?.supplierProfile?.businessName || user?.name}&apos;s Dashboard
                {user?.supplierProfile?.isVerified && <VerifiedBadge />}
              </h1>
              <p className="text-indigo-100 text-sm">Overview of your store performance</p>
              {user?.supplierProfile?.productCategories && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {user.supplierProfile.productCategories.slice(0, 4).map((c: string) => (
                    <span key={c} className="bg-white/10 border border-white/10 rounded-full px-3 py-1">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:border-l sm:border-white/20 sm:pl-6">
              <TrendingUp size={20} className="text-indigo-200" />
              <div>
                <p className="text-2xl font-bold">${revenue8Weeks.toLocaleString()}</p>
                <p className="text-xs text-indigo-200">Revenue (last 8 weeks)</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {stats && (
        <>
          <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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

          <Reveal>
            <div className="flex gap-3 mb-8">
              <Link
                href="/dashboard/supplier/products"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Manage Products
              </Link>
              <Link
                href="/dashboard/supplier/orders"
                className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Orders
              </Link>
              <Link
                href="/dashboard/supplier/quotes"
                className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
              >
                <FileText size={16} /> Quote Requests
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <Reveal className="lg:col-span-2">
              <div className="border rounded-xl bg-white p-4 h-full shadow-sm">
                <h2 className="text-lg font-bold mb-3">Orders (last 8 weeks)</h2>
                <OrdersChart data={stats.ordersPerWeek} />
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="border rounded-xl bg-white p-4 h-full shadow-sm">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-1.5">
                  <Flame size={18} className="text-amber-500" /> Top Products
                </h2>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No sales yet — units sold will rank here.</p>
                ) : (
                  <ul className="space-y-3">
                    {topProducts.map((p, i) => (
                      <li key={p._id} className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}</span>
                        <div className="w-9 h-9 rounded-md bg-gray-100 overflow-hidden shrink-0">
                          {p.images?.[0]?.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.totalSold} units sold</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link
                href="/dashboard/supplier/orders"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500">No recent orders.</p>
            ) : (
              <div className="border rounded-xl bg-white divide-y shadow-sm overflow-hidden">
                {stats.recentOrders.map((o) => (
                  <div key={o._id} className="flex justify-between p-3 text-sm hover:bg-gray-50 transition-colors">
                    <span>#{o._id.slice(-6).toUpperCase()}</span>
                    <span>{o.status}</span>
                    <span className="font-medium">${o.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </>
      )}
    </>
  );
}

export default function SupplierDashboardPage() {
  return (
    <ProtectedRoute role="supplier">
      <DashboardLayout>
        <SupplierDashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
