"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, Phone, MapPin, Clock, Package, Star, CalendarDays } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import ProductCard, { ProductSummary } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

interface SupplierProfile {
  _id: string;
  name: string;
  supplierProfile?: {
    businessName?: string;
    businessType?: string;
    contactInfo?: string;
    address?: string;
    operatingHours?: string;
    fabricTypes?: string[];
    moq?: string;
    isVerified?: boolean;
  };
  memberSince: string;
}

export default function SupplierStorefrontPage() {
  const params = useParams();
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/suppliers/${params.id}`)
      .then((res) => {
        setSupplier(res.data.data.supplier);
        setProductCount(res.data.data.productCount);
        setAvgRating(res.data.data.avgRating);
        setTotalReviews(res.data.data.totalReviews);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));

    api
      .get("/products", { params: { supplierId: params.id, limit: 48 } })
      .then((res) => setProducts(res.data.data.products))
      .catch(() => {});
  }, [params.id]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</div>;
  if (error || !supplier)
    return <div className="max-w-7xl mx-auto px-4 py-12 text-red-600">{error || "Supplier not found"}</div>;

  const profile = supplier.supplierProfile;

  return (
    <div>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <Reveal>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{profile?.businessName || supplier.name}</h1>
              {profile?.isVerified && <VerifiedBadge />}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <Package size={14} /> {productCount} product{productCount === 1 ? "" : "s"}
              </span>
              {totalReviews > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} ({totalReviews}{" "}
                  review{totalReviews === 1 ? "" : "s"})
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} /> Member since {new Date(supplier.memberSince).getFullYear()}
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Reveal className="lg:col-span-1">
          <div className="border rounded-xl bg-white p-4 sticky top-20">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Supplier Details</h2>
            <dl className="space-y-2.5 text-sm text-gray-600">
              {profile?.businessType && (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400 shrink-0" />
                  <dd>{profile.businessType}</dd>
                </div>
              )}
              {profile?.contactInfo && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <dd>{profile.contactInfo}</dd>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <dd>{profile.address}</dd>
                </div>
              )}
              {profile?.operatingHours && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <dd>{profile.operatingHours}</dd>
                </div>
              )}
            </dl>
            {profile?.fabricTypes && profile.fabricTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Fabric types offered</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.fabricTypes.map((f) => (
                    <span key={f} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile?.moq && (
              <div className="mt-4 pt-4 border-t text-sm">
                <span className="text-gray-500">Standard MOQ: </span>
                <span className="font-medium">{profile.moq} units</span>
              </div>
            )}
          </div>
        </Reveal>

        <div className="lg:col-span-3">
          <Reveal>
            <h2 className="text-xl font-bold mb-4">Products from this supplier</h2>
          </Reveal>
          {products.length === 0 ? (
            <ProductGridSkeleton count={6} />
          ) : (
            <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <RevealItem key={p._id}>
                  <ProductCard product={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </div>
  );
}
