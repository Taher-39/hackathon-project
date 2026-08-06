"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useWishlistStore } from "@/lib/store";
import ProductCard, { ProductSummary } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";

function WishlistContent() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setIds = useWishlistStore((s) => s.setIds);

  useEffect(() => {
    api
      .get("/users/wishlist")
      .then((res) => {
        setProducts(res.data.data.products);
        setIds(res.data.data.products.map((p: ProductSummary) => p._id));
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [setIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart size={22} className="text-red-500" /> My Wishlist
      </h1>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">
          No products saved yet. Tap the heart icon on any product to save it here.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute role="buyer">
      <WishlistContent />
    </ProtectedRoute>
  );
}
