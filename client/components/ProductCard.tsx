"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { StarDisplay } from "@/components/StarRating";

export interface ProductSummary {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  images: { url: string }[];
  avgRating?: number;
  numReviews?: number;
}

export default function ProductCard({
  product,
  compareChecked,
  onCompareToggle,
  badge,
}: {
  product: ProductSummary;
  compareChecked?: boolean;
  onCompareToggle?: () => void;
  badge?: "best-seller" | "new";
}) {
  const user = useAuthStore((s) => s.user);
  const { wishlisted, toggle } = useWishlistToggle(product._id);

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: "easeOut" }} className="h-full">
      <Link
        href={`/products/${product._id}`}
        className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg hover:border-indigo-200 transition-shadow flex flex-col h-full"
      >
        {onCompareToggle && (
          <label
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 z-10 bg-white/90 rounded-md px-1.5 py-1 flex items-center gap-1 text-xs shadow-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!compareChecked}
              onChange={onCompareToggle}
              onClick={(e) => e.stopPropagation()}
            />
            Compare
          </label>
        )}
        {user?.role === "buyer" && (
          <button
            onClick={toggleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow-sm hover:bg-white transition-transform hover:scale-110"
          >
            <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-500"} />
          </button>
        )}
        <div className="aspect-square bg-gray-100 overflow-hidden relative">
          {badge && (
            <span
              className={`absolute bottom-2 left-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${
                badge === "best-seller" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {badge === "best-seller" ? "🔥 Best Seller" : "✨ New"}
            </span>
          )}
          {product.images?.[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-1">
          <span className="text-xs text-indigo-600 font-medium uppercase">{product.category}</span>
          <h3 className="font-medium line-clamp-2 group-hover:text-indigo-700 transition-colors">{product.name}</h3>
          {!!product.numReviews && <StarDisplay rating={product.avgRating || 0} count={product.numReviews} />}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-bold">${product.price.toFixed(2)}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                product.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {product.status === "available" ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
