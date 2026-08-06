"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Heart,
  ZoomIn,
  Building2,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  FileText,
  X,
  Tags,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useCartStore, useToastStore } from "@/lib/store";
import ProductCard, { ProductSummary } from "@/components/ProductCard";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import ImageLightbox from "@/components/ImageLightbox";
import { StarDisplay, StarInput } from "@/components/StarRating";
import VerifiedBadge from "@/components/VerifiedBadge";
import RecentlyViewed from "@/components/RecentlyViewed";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  colors: string[];
  specifications?: string;
  fabricType?: string;
  stock: number;
  price: number;
  moq: number;
  priceTiers?: { minQty: number; price: number }[];
  sizes?: { label: string; stock: number }[];
  status: string;
  images: { url: string }[];
  avgRating?: number;
  numReviews?: number;
  supplierId: {
    _id: string;
    name: string;
    supplierProfile?: {
      businessName?: string;
      businessType?: string;
      contactInfo?: string;
      address?: string;
      operatingHours?: string;
      isVerified?: boolean;
    };
  };
}

interface Review {
  _id: string;
  buyerId: { _id: string; name: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore((s) => s.show);
  const { wishlisted, toggle: toggleWishlist } = useWishlistToggle(String(params.id));

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const [similar, setSimilar] = useState<ProductSummary[]>([]);
  const [question, setQuestion] = useState("");
  const [qnaAnswer, setQnaAnswer] = useState("");
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaError, setQnaError] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteQty, setQuoteQty] = useState(1);
  const [quoteTarget, setQuoteTarget] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  function loadReviews() {
    api
      .get(`/products/${params.id}/reviews`)
      .then((res) => {
        const list: Review[] = res.data.data.reviews;
        setReviews(list);
        const mine = list.find((r) => r.buyerId?._id === user?._id);
        if (mine) {
          setMyRating(mine.rating);
          setMyComment(mine.comment || "");
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    api
      .get(`/products/${params.id}`)
      .then((res) => {
        setProduct(res.data.data.product);
        setQuantity(res.data.data.product.moq || 1);
        addRecentlyViewed(String(params.id));
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));

    api
      .get(`/assistant/similar/${params.id}`)
      .then((res) => setSimilar(res.data.data.products))
      .catch(() => {});

    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!myRating) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/products/${params.id}/reviews`, { rating: myRating, comment: myComment });
      toast("Review saved", "success");
      loadReviews();
      const res = await api.get(`/products/${params.id}`);
      setProduct(res.data.data.product);
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setQnaLoading(true);
    setQnaError("");
    setQnaAnswer("");
    try {
      const res = await api.post(`/assistant/product-qna/${params.id}`, { question });
      setQnaAnswer(res.data.data.reply);
    } catch (err) {
      setQnaError(apiErrorMessage(err));
    } finally {
      setQnaLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "buyer") {
      toast("Only buyer accounts can add products to cart", "error");
      return;
    }
    if (product.sizes?.length && !selectedSize) {
      toast("Please select a size", "error");
      return;
    }
    const sizeEntry = selectedSize ? product.sizes?.find((s) => s.label === selectedSize) : undefined;
    const availableStock = sizeEntry ? sizeEntry.stock : product.stock;

    if (quantity < product.moq) {
      toast(`Minimum order quantity is ${product.moq} units`, "error");
      return;
    }
    if (quantity > availableStock) {
      toast(`Only ${availableStock} unit(s) in stock${selectedSize ? ` for size ${selectedSize}` : ""}`, "error");
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      price: tierPriceFor(quantity),
      image: product.images[0]?.url,
      moq: product.moq,
      stock: availableStock,
      quantity,
      size: selectedSize || undefined,
    });
    setAdded(true);
    toast(`Added ${product.name}${selectedSize ? ` (${selectedSize})` : ""} to cart`, "success");
    setTimeout(() => setAdded(false), 2000);
  }

  // Highest tier whose minQty is met by the given quantity wins — mirrors the
  // server-side logic in utils/pricing.js so what a buyer sees here is exactly
  // what they'll be charged if they order that many units.
  function tierPriceFor(qty: number): number {
    if (!product?.priceTiers?.length) return product?.price || 0;
    const qualifying = product.priceTiers.filter((t) => qty >= t.minQty).sort((a, b) => b.minQty - a.minQty);
    return qualifying.length ? qualifying[0].price : product.price;
  }

  function openQuoteModal() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "buyer") {
      toast("Only buyer accounts can request quotes", "error");
      return;
    }
    setQuoteQty(product ? Math.max(product.moq, 1) : 1);
    setQuoteTarget("");
    setQuoteMessage("");
    setQuoteSent(false);
    setQuoteError("");
    setQuoteOpen(true);
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!product || quoteQty < 1) return;
    setQuoteSubmitting(true);
    setQuoteError("");
    try {
      await api.post("/quotes", {
        productId: product._id,
        quantity: quoteQty,
        targetPrice: quoteTarget ? Number(quoteTarget) : undefined,
        message: quoteMessage,
      });
      setQuoteSent(true);
      toast("Quote request sent to supplier", "success");
    } catch (err) {
      setQuoteError(apiErrorMessage(err));
    } finally {
      setQuoteSubmitting(false);
    }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</div>;
  if (error || !product)
    return <div className="max-w-7xl mx-auto px-4 py-12 text-red-600">{error || "Product not found"}</div>;

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div
          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 group cursor-zoom-in"
          onClick={() => product.images[activeImage]?.url && setLightboxOpen(true)}
        >
          {product.images[activeImage]?.url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.images[activeImage].url} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn
                  size={28}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                  i === activeImage ? "border-indigo-600" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs text-indigo-600 font-medium uppercase">{product.category}</span>
            <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          </div>
          {user?.role === "buyer" && (
            <button
              onClick={toggleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="shrink-0 border rounded-full p-2 hover:bg-gray-50"
            >
              <Heart size={18} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-500"} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          Sold by {product.supplierId?.supplierProfile?.businessName || product.supplierId?.name}
          {product.supplierId?.supplierProfile?.isVerified && <VerifiedBadge />}
        </p>
        {!!product.numReviews && (
          <div className="mt-1">
            <StarDisplay rating={product.avgRating || 0} count={product.numReviews} />
          </div>
        )}
        <div className="flex items-baseline gap-2 mt-4">
          <p className="text-3xl font-bold">${tierPriceFor(quantity).toFixed(2)}</p>
          {tierPriceFor(quantity) < product.price && (
            <span className="text-sm text-gray-400 line-through">${product.price.toFixed(2)}</span>
          )}
          <span className="text-sm text-gray-500">/ unit</span>
        </div>

        {!!product.priceTiers?.length && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            <div className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 flex items-center gap-1.5">
              <Tags size={13} /> Bulk pricing — buy more, save more
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className={quantity < (product.priceTiers[0]?.minQty ?? 0) ? "bg-indigo-50/60" : ""}>
                  <td className="px-3 py-1.5 text-gray-600">1 – {product.priceTiers[0].minQty - 1} units</td>
                  <td className="px-3 py-1.5 text-right font-medium">${product.price.toFixed(2)}</td>
                </tr>
                {product.priceTiers.map((t, i) => {
                  const next = product.priceTiers?.[i + 1];
                  const active = quantity >= t.minQty && (!next || quantity < next.minQty);
                  return (
                    <tr key={t.minQty} className={active ? "bg-indigo-50/60" : ""}>
                      <td className="px-3 py-1.5 text-gray-600">
                        {t.minQty}
                        {next ? ` – ${next.minQty - 1}` : "+"} units
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium">${t.price.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <span
          className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
            product.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {product.status === "available" ? `In stock (${product.stock})` : "Out of stock"}
        </span>

        <p className="text-gray-700 mt-4">{product.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {product.fabricType && (
            <>
              <dt className="text-gray-500">Fabric type</dt>
              <dd>{product.fabricType}</dd>
            </>
          )}
          {product.colors?.length > 0 && (
            <>
              <dt className="text-gray-500">Colors</dt>
              <dd>{product.colors.join(", ")}</dd>
            </>
          )}
          <dt className="text-gray-500">MOQ</dt>
          <dd>{product.moq} units</dd>
          {product.specifications && (
            <>
              <dt className="text-gray-500">Specifications</dt>
              <dd>{product.specifications}</dd>
            </>
          )}
        </dl>

        {!!product.sizes?.length && user?.role !== "supplier" && (
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">
              Select size{selectedSize ? ` — ${selectedSize} (${product.sizes.find((s) => s.label === selectedSize)?.stock ?? 0} in stock)` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const outOfStock = s.stock <= 0;
                const active = selectedSize === s.label;
                return (
                  <button
                    key={s.label}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      setSelectedSize(s.label);
                      setQuantity(Math.min(Math.max(product.moq, 1), s.stock));
                    }}
                    title={outOfStock ? `${s.label} — out of stock` : `${s.label} — ${s.stock} in stock`}
                    className={`min-w-[2.75rem] px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      outOfStock
                        ? "border-gray-100 text-gray-300 line-through cursor-not-allowed bg-gray-50"
                        : active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 text-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.status === "available" && user?.role !== "supplier" && (
          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={product.moq}
              max={selectedSize ? product.sizes?.find((s) => s.label === selectedSize)?.stock ?? 0 : product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24 border rounded-md px-3 py-2"
            />
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
            >
              {added ? "Added to cart!" : "Add to Cart"}
            </button>
          </div>
        )}

        {user?.role !== "supplier" && (
          <button
            onClick={openQuoteModal}
            className="mt-3 w-full border border-indigo-200 text-indigo-700 py-2 rounded-md hover:bg-indigo-50 inline-flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <FileText size={15} /> Request a custom bulk quote
          </button>
        )}

        <div className="mt-8 border-t pt-6">
          <h2 className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
            <Sparkles size={16} className="text-indigo-600" /> Ask AI about this product
          </h2>
          <form onSubmit={askQuestion} className="mt-2 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Is this suitable for summer clothing?"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={qnaLoading || !question.trim()}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {qnaLoading && <Loader2 size={14} className="animate-spin" />}
              Ask
            </button>
          </form>
          {qnaError && <p className="text-red-600 text-sm mt-2">{qnaError}</p>}
          {qnaAnswer && (
            <p className="mt-2 text-sm bg-indigo-50 text-indigo-900 rounded-md px-3 py-2 whitespace-pre-wrap">
              {qnaAnswer}
            </p>
          )}
        </div>

        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold text-sm text-gray-900">Supplier Details</h2>
            {product.supplierId?.supplierProfile?.isVerified && <VerifiedBadge />}
          </div>
          <p className="font-medium text-gray-900">
            {product.supplierId?.supplierProfile?.businessName || product.supplierId?.name}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm text-gray-600">
            {product.supplierId?.supplierProfile?.businessType && (
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <dd>{product.supplierId.supplierProfile.businessType}</dd>
              </div>
            )}
            {product.supplierId?.supplierProfile?.contactInfo && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <dd>{product.supplierId.supplierProfile.contactInfo}</dd>
              </div>
            )}
            {product.supplierId?.supplierProfile?.address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <dd>{product.supplierId.supplierProfile.address}</dd>
              </div>
            )}
            {product.supplierId?.supplierProfile?.operatingHours && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <dd>{product.supplierId.supplierProfile.operatingHours}</dd>
              </div>
            )}
          </dl>
          {product.supplierId?._id && (
            <Link
              href={`/suppliers/${product.supplierId._id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all products from this supplier <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="font-semibold text-sm text-gray-900">Ratings & Reviews</h2>

          {user?.role === "buyer" && (
            <form onSubmit={submitReview} className="mt-3 border rounded-md p-3 space-y-2">
              <p className="text-xs text-gray-500">{myRating ? "Update your review" : "Leave a review"}</p>
              <StarInput value={myRating} onChange={setMyRating} />
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Share your experience with this fabric (optional)"
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={2}
              />
              <button
                type="submit"
                disabled={!myRating || reviewSubmitting}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
              >
                {reviewSubmitting ? "Saving..." : "Submit review"}
              </button>
            </form>
          )}

          <div className="mt-4 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="border-b pb-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.buyerId?.name || "Buyer"}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <StarDisplay rating={r.rating} size={12} />
                  {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="md:col-span-2 border-t pt-6 mt-2">
          <h2 className="font-semibold mb-3">Similar products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={product.images}
          index={activeImage}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActiveImage}
        />
      )}

      <AnimatePresence>
        {quoteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setQuoteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
                <h2 className="font-semibold flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-600" /> Request a bulk quote
                </h2>
                <button onClick={() => setQuoteOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {quoteSent ? (
                  <div className="text-center py-6">
                    <p className="text-green-700 font-medium mb-1">Quote request sent!</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {product.supplierId?.supplierProfile?.businessName || product.supplierId?.name} will respond
                      with custom pricing. Track it from your dashboard.
                    </p>
                    <Link
                      href="/dashboard/buyer/quotes"
                      className="text-indigo-600 font-medium text-sm hover:text-indigo-700"
                    >
                      View my quote requests
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={submitQuote} className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Ask{" "}
                      <span className="font-medium text-gray-700">
                        {product.supplierId?.supplierProfile?.businessName || product.supplierId?.name}
                      </span>{" "}
                      for custom pricing on <span className="font-medium text-gray-700">{product.name}</span>.
                    </p>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={quoteQty}
                        onChange={(e) => setQuoteQty(Number(e.target.value))}
                        className="w-full border rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Target price per unit (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={quoteTarget}
                        onChange={(e) => setQuoteTarget(e.target.value)}
                        placeholder={`e.g. ${(product.price * 0.9).toFixed(2)}`}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Message (optional)</label>
                      <textarea
                        value={quoteMessage}
                        onChange={(e) => setQuoteMessage(e.target.value)}
                        placeholder="e.g. Recurring monthly order, need consistent pricing"
                        className="w-full border rounded-md px-3 py-2"
                        rows={3}
                      />
                    </div>
                    {quoteError && <p className="text-red-600 text-sm">{quoteError}</p>}
                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {quoteSubmitting ? "Sending..." : "Send request"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <RecentlyViewed excludeId={String(params.id)} />
    </>
  );
}
