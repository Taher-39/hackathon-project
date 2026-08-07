"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Store,
  ShieldCheck,
  Package,
  ClipboardList,
  CheckCircle,
  FileText,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

interface RecentOrder {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  buyerName: string;
}

interface Stats {
  totalBuyers: number;
  totalSuppliers: number;
  verifiedSuppliers: number;
  activeProducts: number;
  orderCount: number;
  completedOrders: number;
  pendingQuotes: number;
  platformRevenue: number;
  confirmedGrossSales: number;
  recentOrders: RecentOrder[];
}

const TILES = [
  { key: "totalBuyers" as const, label: "Total Buyers", icon: Users, color: "text-indigo-600 bg-indigo-50" },
  { key: "totalSuppliers" as const, label: "Total Suppliers", icon: Store, color: "text-purple-600 bg-purple-50" },
  { key: "verifiedSuppliers" as const, label: "Verified Suppliers", icon: ShieldCheck, color: "text-teal-600 bg-teal-50" },
  { key: "activeProducts" as const, label: "Active Products", icon: Package, color: "text-blue-600 bg-blue-50" },
  { key: "orderCount" as const, label: "Total Orders", icon: ClipboardList, color: "text-amber-600 bg-amber-50" },
  { key: "completedOrders" as const, label: "Completed Orders", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  { key: "pendingQuotes" as const, label: "Pending Quotes", icon: FileText, color: "text-rose-600 bg-rose-50" },
];

function AdminOverviewContent() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/admin")
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  return (
    <>
      <Reveal>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-white p-6 mb-6">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name || "Admin"}</h1>
              <p className="text-slate-200 text-sm">Marketplace-wide activity and platform revenue</p>
            </div>
            <div className="flex items-center gap-2 sm:border-l sm:border-white/20 sm:pl-6">
              <Wallet size={20} className="text-slate-200" />
              <div>
                <p className="text-2xl font-bold">${(stats?.platformRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-slate-300">
                  Platform commission (10% on supplier-confirmed orders)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {stats && (
        <>
          <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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
            <div className="border rounded-xl bg-white p-4 mb-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Gross sales vs. platform commission</h2>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.confirmedGrossSales.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confirmed gross sales — supplier-accepted order value, across all orders
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">
                    ${stats.platformRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Platform revenue — 10% commission taken from the supplier&apos;s side only,
                    charged the moment each supplier confirms (accepts) an order
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="flex gap-3 mb-8 flex-wrap">
              <Link href="/dashboard/admin/buyers" className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Manage Buyers
              </Link>
              <Link href="/dashboard/admin/suppliers" className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Manage Suppliers
              </Link>
              <Link href="/dashboard/admin/orders" className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                All Orders
              </Link>
              <Link href="/dashboard/admin/audit-log" className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Audit Log
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link
                href="/dashboard/admin/orders"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500">No orders yet.</p>
            ) : (
              <div className="border rounded-xl bg-white divide-y shadow-sm overflow-hidden">
                {stats.recentOrders.map((o) => (
                  <div key={o._id} className="flex justify-between p-3 text-sm hover:bg-gray-50 transition-colors">
                    <span>#{o._id.slice(-6).toUpperCase()}</span>
                    <span className="text-gray-500">{o.buyerName}</span>
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

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminOverviewContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
