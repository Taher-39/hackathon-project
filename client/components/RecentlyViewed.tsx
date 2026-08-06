"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "@/lib/api";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import { useAuthStore } from "@/lib/store";
import ProductCard, { ProductSummary } from "@/components/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  // Re-read the list whenever the logged-in account changes, so switching
  // accounts on the same browser (without a full page remount) can't show
  // the previous account's history.
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    const ids = getRecentlyViewedIds().filter((id) => id !== excludeId);
    if (!ids.length) {
      setProducts([]);
      return;
    }
    api
      .get("/products", { params: { ids: ids.join(","), limit: ids.length } })
      .then((res) => {
        const byId = new Map(res.data.data.products.map((p: ProductSummary) => [p._id, p]));
        // Preserve most-recently-viewed-first order; Mongo doesn't guarantee $in order.
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as ProductSummary[];
        setProducts(ordered.slice(0, 8));
      })
      .catch(() => {});
  }, [excludeId, userId]);

  if (!products.length) return null;

  return (
    <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <History size={20} className="text-indigo-600" /> Recently viewed
      </h2>
      <p className="text-gray-500 text-sm mb-6">Pick up where you left off.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </Reveal>
  );
}
