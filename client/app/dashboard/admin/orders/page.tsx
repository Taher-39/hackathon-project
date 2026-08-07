"use client";

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";

interface AdminOrderRow {
  _id: string;
  buyerName: string;
  buyerEmail?: string;
  itemCount: number;
  totalAmount: number;
  platformFee: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["Pending", "Accepted", "Preparing", "Ready for Dispatch", "Completed"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-50 text-yellow-700",
  Accepted: "bg-blue-50 text-blue-700",
  Preparing: "bg-purple-50 text-purple-700",
  "Ready for Dispatch": "bg-indigo-50 text-indigo-700",
  Completed: "bg-green-50 text-green-700",
};

function AdminOrdersContent() {
  const toast = useToastStore((s) => s.show);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/orders", { params: { status: status || undefined, page, limit: 20 } })
      .then((res) => {
        setOrders(res.data.data.orders);
        setPages(res.data.data.pages);
      })
      .catch((err) => toast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const pageFeeTotal = orders.reduce((sum, o) => sum + o.platformFee, 0);
  const pageGrossTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">All Orders</h1>
      <p className="text-gray-500 text-sm mb-4">
        Every order placed on the marketplace, including historical ones, with the platform fee
        collected from the supplier&apos;s side once each order is confirmed.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500 flex items-center gap-4">
          <span>
            Page total: <strong className="text-gray-800">${pageGrossTotal.toFixed(2)}</strong>
          </span>
          <span>
            Page platform fee: <strong className="text-indigo-600">${pageFeeTotal.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} />
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Buyer</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Platform Fee</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="p-3 text-gray-600">
                    {o.buyerName}
                    {o.buyerEmail && <span className="block text-xs text-gray-400">{o.buyerEmail}</span>}
                  </td>
                  <td className="p-3 text-gray-500">{o.itemCount}</td>
                  <td className="p-3 font-medium">${o.totalAmount.toFixed(2)}</td>
                  <td className="p-3 text-indigo-600">
                    {o.platformFee > 0 ? `$${o.platformFee.toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminOrdersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
