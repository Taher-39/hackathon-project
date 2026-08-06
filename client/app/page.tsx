"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  X,
  Loader2,
  Shirt,
  Gem,
  Layers,
  Leaf,
  Snowflake,
  Home,
  Package,
  ShieldCheck,
  MessageCircle,
  Truck,
  ArrowRight,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiErrorMessage } from "@/lib/api";
import { useAssistantStore } from "@/lib/store";
import ProductCard, { ProductSummary } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import HeroCarousel, { HeroSlide } from "@/components/HeroCarousel";
import RecentlyViewed from "@/components/RecentlyViewed";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

const PAGE_SIZE = 12;

// Kept in sync with every category actually seeded in the DB — this doubles
// as the last-resort fallback list if /products/categories can't be reached
// (e.g. a cold-starting free-tier server), so a real category never just
// vanishes because of a slow/failed request. Object.keys() below is what
// renders when that happens, so any category missing here would disappear.
const CATEGORY_ICONS: Record<string, typeof Shirt> = {
  Cotton: Shirt,
  Silk: Gem,
  Denim: Layers,
  Linen: Leaf,
  Wool: Snowflake,
  "Home Textile": Home,
};

function categoryIcon(name: string) {
  return CATEGORY_ICONS[name] || Package;
}

export default function HomePage() {
  const setAssistantOpen = useAssistantStore((s) => s.setOpen);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [bestSellers, setBestSellers] = useState<ProductSummary[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductSummary[]>([]);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [compareResult, setCompareResult] = useState<{ reply: string; products: ProductSummary[] } | null>(null);

  const browseRef = useRef<HTMLDivElement>(null);

  function scrollToBrowse() {
    browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleCompare(id: string) {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((i) => i !== id);
      if (ids.length >= 4) return ids;
      return [...ids, id];
    });
  }

  async function runCompare() {
    setCompareOpen(true);
    setCompareLoading(true);
    setCompareError("");
    try {
      const res = await api.post("/assistant/compare", { productIds: compareIds });
      setCompareResult(res.data.data);
    } catch (err) {
      setCompareError(apiErrorMessage(err));
    } finally {
      setCompareLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    // A dropped/failed request used to leave this section permanently stuck
    // on the hardcoded fallback list, which looked like "Home Textile"
    // randomly not showing up. A free-tier backend waking from a cold start
    // can easily take longer than a single quick retry, so back off across
    // 3 attempts (1.5s, 3s, 5s) before giving up — and only fall back to the
    // hardcoded list (now kept in sync with every seeded category) as a
    // last resort, never mid-flight.
    const RETRY_DELAYS_MS = [1500, 3000, 5000];
    function loadCategories(attempt = 0) {
      api
        .get("/products/categories")
        .then((res) => {
          if (cancelled) return;
          setCategories(res.data.data.categories);
          setCategoriesLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < RETRY_DELAYS_MS.length) {
            setTimeout(() => loadCategories(attempt + 1), RETRY_DELAYS_MS[attempt]);
            return;
          }
          setCategories(Object.keys(CATEGORY_ICONS));
          setCategoriesLoading(false);
        });
    }
    loadCategories();

    api
      .get("/products/best-sellers", { params: { limit: 8 } })
      .then((res) => setBestSellers(res.data.data.products))
      .catch(() => {});

    api
      .get("/products", { params: { limit: 8, page: 1 } })
      .then((res) => setNewArrivals(res.data.data.products))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce only the live-typed search box; category/price changes below
  // apply immediately since they don't fire on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Any filter change starts a fresh result set from page 1 — infinite
  // scroll then appends further pages as the user reaches the bottom.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    api
      .get("/products", { params })
      .then((res) => {
        if (cancelled) return;
        setProducts((prev) => (page === 1 ? res.data.data.products : [...prev, ...res.data.data.products]));
        setPages(res.data.data.pages || 1);
        setTotalProducts(res.data.data.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, minPrice, maxPrice, page]);

  function loadMoreProducts() {
    if (loading || loadingMore || page >= pages) return;
    setPage((p) => p + 1);
  }

  const sentinelRef = useInfiniteScroll(loadMoreProducts, !loading && page < pages);

  function browseCategory(cat: string) {
    setCategory(cat);
    scrollToBrowse();
  }

  const heroSlides: HeroSlide[] = [
    {
      eyebrow: "AI-powered sourcing, live inventory",
      title: "Source fabric directly from verified suppliers",
      description:
        "Browse thousands of yards across cotton, silk, denim, linen, and wool. Compare pricing and MOQ, ask our AI assistant, and place bulk orders — all in one place.",
      image:
        "https://images.unsplash.com/photo-1615799998603-7c6270a45196?w=1600&h=1000&q=80&auto=format&fit=crop",
      primaryLabel: "Browse Marketplace",
      onPrimaryClick: scrollToBrowse,
      secondaryHref: "/register",
      secondaryLabel: "Become a Supplier",
    },
    {
      eyebrow: "Every category, one storefront",
      title: "From raw cotton bolls to finished bolts of denim",
      description:
        "Transparent pricing, real stock counts, and minimum order quantities on every listing — no back-and-forth emails required to get a straight answer.",
      image:
        "https://images.unsplash.com/photo-1594734415578-00fc9540929b?w=1600&h=1000&q=80&auto=format&fit=crop",
      primaryLabel: "Explore Categories",
      onPrimaryClick: scrollToBrowse,
      secondaryHref: "/about",
      secondaryLabel: "How it works",
    },
    {
      eyebrow: "Ask, compare, decide",
      title: "Let our AI assistant find your next fabric",
      description:
        "Describe what you need in plain language — the assistant searches live inventory and returns real matches, no hardcoded picks.",
      image:
        "https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?w=1600&h=1000&q=80&auto=format&fit=crop",
      primaryLabel: "Ask the Assistant",
      onPrimaryClick: () => setAssistantOpen(true),
      secondaryHref: "/register",
      secondaryLabel: "Join as Supplier",
    },
  ];

  return (
    <div>
      <HeroCarousel slides={heroSlides} />

      {/* Trust / stats strip */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-6 text-center sm:text-left">
          <div className="text-center">
            <AnimatedCounter value={totalProducts || 15} className="text-2xl sm:text-3xl font-bold text-indigo-700" />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Products listed</p>
          </div>
          <div className="text-center">
            <AnimatedCounter
              value={categories.length || 5}
              className="text-2xl sm:text-3xl font-bold text-indigo-700"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Fabric categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-700">24/7</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">AI sourcing assistant</p>
          </div>
        </div>
      </section>

      {/* Category section */}
      {/* This sits right at the top of the page, so its reveal is tied
          directly to categoriesLoading (animate) rather than scroll position
          (whileInView, via Reveal/RevealGroup elsewhere on this page). A
          scroll-gated reveal here raced against the categories fetch and
          could leave the buttons in the DOM with opacity: 0 — present but
          invisible, and unrecoverable without a scroll event to re-trigger
          it. Driving the animation off real data state instead means it
          always resolves to visible once categories arrive, regardless of
          fetch timing or scroll position. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-2xl font-bold mb-1">Shop by category</h2>
          <p className="text-gray-500 text-sm mb-6">Jump straight to the fabric type you need.</p>
        </motion.div>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          initial="hidden"
          animate={categoriesLoading ? "hidden" : "show"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {categoriesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl bg-white p-4 h-[92px] animate-pulse"
                />
              ))
            : categories.slice(0, 10).map((cat) => {
                const Icon = categoryIcon(cat);
                return (
                  <motion.div
                    key={cat}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    <motion.button
                      onClick={() => browseCategory(cat)}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full border border-gray-200 rounded-xl bg-white p-4 flex flex-col items-center gap-2 hover:shadow-lg hover:border-indigo-200 transition-shadow"
                    >
                      <div className="bg-indigo-50 text-indigo-600 rounded-full p-3">
                        <Icon size={22} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 text-center">{cat}</span>
                    </motion.button>
                  </motion.div>
                );
              })}
        </motion.div>
      </section>

      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <Reveal>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Flame size={22} className="text-amber-500" /> Best sellers
            </h2>
            <p className="text-gray-500 text-sm mb-6">Ranked by real units sold across the marketplace.</p>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map((p) => (
              <RevealItem key={p._id}>
                <ProductCard product={p} badge="best-seller" />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 bg-gray-50/50">
          <Reveal>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Sparkles size={22} className="text-emerald-600" /> New arrivals
            </h2>
            <p className="text-gray-500 text-sm mb-6">Freshly listed by our suppliers.</p>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((p) => (
              <RevealItem key={p._id}>
                <ProductCard product={p} badge="new" />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div ref={browseRef} id="browse" className="pt-2 scroll-mt-20">
          <Reveal>
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <h2 className="text-2xl font-bold">Browse all products</h2>
              {!loading && totalProducts > 0 && (
                <span className="text-sm text-gray-500">
                  Showing {products.length} of {totalProducts}
                </span>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, categories..."
                  className="w-full border border-gray-200 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min $"
                type="number"
                className="border border-gray-200 rounded-md px-3 py-2 w-full sm:w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max $"
                type="number"
                className="border border-gray-200 rounded-md px-3 py-2 w-full sm:w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </Reveal>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products found. Try adjusting your search or filters.</p>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {products.map((p, i) => (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, delay: Math.min(i % PAGE_SIZE, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ProductCard
                        product={p}
                        compareChecked={compareIds.includes(p._id)}
                        onCompareToggle={() => toggleCompare(p._id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Infinite scroll: this sentinel triggers the next page as it
                  enters the viewport; it's invisible once nothing is loading
                  and there are no more pages. */}
              {page < pages && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  {loadingMore && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={16} className="animate-spin" /> Loading more...
                    </span>
                  )}
                </div>
              )}
              {page >= pages && totalProducts > PAGE_SIZE && (
                <p className="text-center text-sm text-gray-400 py-8">
                  You&apos;ve reached the end — {totalProducts} products total.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-800 to-indigo-600">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <Reveal className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Need help sourcing?</h2>
            <p className="text-indigo-100 text-sm">Ask our AI assistant to find the right fabric for your order.</p>
          </div>
          <button
            onClick={() => setAssistantOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10"
          >
            <Sparkles size={16} /> Ask the Assistant
          </button>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <Reveal>
          <h2 className="text-2xl font-bold mb-1">Why choose us?</h2>
          <p className="text-gray-500 text-sm mb-8">We make sourcing fabric simple, transparent, and fast.</p>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: "Verified suppliers",
              desc: "Look for the verified badge on trusted, established mills.",
            },
            {
              icon: MessageCircle,
              title: "AI sourcing assistant",
              desc: "Ask in plain language and get real matches from live inventory.",
            },
            {
              icon: Truck,
              title: "Bulk-order ready",
              desc: "Transparent MOQ and stock on every listing — no surprises.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <RevealItem key={title}>
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full border border-gray-200 rounded-xl bg-white p-5 flex items-start gap-4 hover:shadow-lg hover:border-indigo-200 transition-shadow"
              >
                <div className="bg-indigo-50 text-indigo-600 rounded-lg p-2.5 shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <RecentlyViewed />

      <section className="relative overflow-hidden bg-gray-900">
        <div className="absolute -right-24 -top-24 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <Reveal className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Are you a textile supplier?</h2>
            <p className="text-gray-300 text-sm">List your catalog and start receiving bulk orders today.</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Join as a Supplier <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>

      <AnimatePresence>
        {compareIds.length >= 2 && !compareOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 text-sm"
          >
            <span>{compareIds.length} selected</span>
            <button
              onClick={runCompare}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} /> Compare
            </button>
            <button onClick={() => setCompareIds([])} className="text-gray-300 hover:text-white">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="font-semibold flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-600" /> AI Comparison
                </h2>
                <button onClick={() => setCompareOpen(false)} aria-label="Close comparison">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {compareLoading && (
                  <p className="text-gray-500 inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Comparing products...
                  </p>
                )}
                {compareError && <p className="text-red-600">{compareError}</p>}
                {compareResult && (
                  <>
                    <p className="text-sm whitespace-pre-wrap bg-indigo-50 text-indigo-900 rounded-md px-3 py-2 mb-4">
                      {compareResult.reply}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {compareResult.products.map((p) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
