"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderStatusStepper from "@/components/OrderStatusStepper";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal } from "@/components/motion/Reveal";

interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number; supplierId: string; size?: string }[];
  shippingInfo: { fullName: string; phone: string; address: string; city: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["Pending", "Accepted", "Preparing", "Ready for Dispatch", "Completed"];

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Accepted: "bg-blue-100 text-blue-800",
  Preparing: "bg-purple-100 text-purple-800",
  "Ready for Dispatch": "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
};

function SupplierOrdersContent() {
  const { user } = useAuthStore();
  const toast = useToastStore((s) => s.show);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  function loadOrders() {
    setLoading(true);
    api
      .get("/orders/supplier")
      .then((res) => setOrders(res.data.data.orders))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadOrders, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast(`Order #${id.slice(-6).toUpperCase()} updated to "${status}"`, "success");
      loadOrders();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <Reveal>
        <h1 className="text-2xl font-bold mb-6">Incoming Orders</h1>
      </Reveal>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <div className="border rounded-xl bg-white p-10 text-center">
          <ClipboardList size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order, i) => {
              const myItems = order.items.filter((item) => String(item.supplierId) === String(user?._id));
              return (
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
                  <p className="text-sm mb-1">
                    <span className="text-gray-500">Ship to:</span> {order.shippingInfo.fullName},{" "}
                    {order.shippingInfo.address}, {order.shippingInfo.city} · {order.shippingInfo.phone}
                  </p>
                  <ul className="text-sm text-gray-700 mb-3">
                    {myItems.map((item, j) => (
                      <li key={j}>
                        {item.name}
                        {item.size ? ` (${item.size})` : ""} × {item.quantity} — $
                        {(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Update status:</label>
                    <select
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function SupplierOrdersPage() {
  return (
    <ProtectedRoute role="supplier">
      <DashboardLayout>
        <SupplierOrdersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
