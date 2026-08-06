"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Check, X, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal } from "@/components/motion/Reveal";

interface Quote {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  targetPrice?: number;
  message?: string;
  status: "Pending" | "Responded" | "Accepted" | "Declined";
  response?: { price: number; message?: string; respondedAt: string };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Responded: "bg-blue-100 text-blue-800",
  Accepted: "bg-green-100 text-green-800",
  Declined: "bg-red-100 text-red-800",
};

function BuyerQuotesContent() {
  const toast = useToastStore((s) => s.show);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/quotes/mine")
      .then((res) => setQuotes(res.data.data.quotes))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, status: "Accepted" | "Declined") {
    setActingId(id);
    try {
      await api.put(`/quotes/${id}/status`, { status });
      toast(`Quote ${status.toLowerCase()}`, "success");
      load();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <Reveal>
        <h1 className="text-2xl font-bold mb-1">My Quote Requests</h1>
        <p className="text-gray-500 mb-6">
          Track custom bulk-pricing requests you&apos;ve sent to suppliers.
        </p>
      </Reveal>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : quotes.length === 0 ? (
        <div className="border rounded-xl bg-white p-10 text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            No quote requests yet. Ask a supplier for custom bulk pricing from any product page.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {quotes.map((q, i) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="border rounded-xl bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-md bg-gray-100 overflow-hidden shrink-0">
                    {q.productImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.productImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/products/${q.productId}`} className="font-medium hover:text-indigo-700">
                        {q.productName}
                      </Link>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[q.status]}`}>{q.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Qty {q.quantity}
                      {q.targetPrice != null && ` · target $${q.targetPrice.toFixed(2)}/unit`}
                    </p>
                    {q.message && <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{q.message}&rdquo;</p>}

                    {q.response && (
                      <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                        <p className="text-sm font-semibold text-indigo-900">
                          Supplier offer: ${q.response.price.toFixed(2)} / unit
                          <span className="font-normal text-indigo-700">
                            {" "}
                            (${(q.response.price * q.quantity).toFixed(2)} total)
                          </span>
                        </p>
                        {q.response.message && (
                          <p className="text-sm text-indigo-800 mt-1">{q.response.message}</p>
                        )}
                        {q.status === "Responded" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => act(q._id, "Accepted")}
                              disabled={actingId === q._id}
                              className="inline-flex items-center gap-1 bg-green-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-60"
                            >
                              {actingId === q._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              Accept
                            </button>
                            <button
                              onClick={() => act(q._id, "Declined")}
                              disabled={actingId === q._id}
                              className="inline-flex items-center gap-1 border text-sm px-3 py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-60"
                            >
                              <X size={13} /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{new Date(q.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function BuyerQuotesPage() {
  return (
    <ProtectedRoute role="buyer">
      <DashboardLayout>
        <BuyerQuotesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
