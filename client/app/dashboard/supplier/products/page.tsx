"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Minus, PackagePlus } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import { ProductGridSkeleton } from "@/components/Skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal } from "@/components/motion/Reveal";

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
  status: string;
  images: { url: string; publicId?: string }[];
  sizes?: { label: string; stock: number }[];
  priceTiers?: { minQty: number; price: number }[];
}

interface SizeRow {
  label: string;
  stock: string;
}

interface TierRow {
  minQty: string;
  price: string;
}

const emptyForm = {
  name: "",
  category: "",
  description: "",
  colors: "",
  specifications: "",
  fabricType: "",
  stock: "",
  price: "",
  moq: "1",
};

const inputClass =
  "w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-shadow";

function SupplierProductsContent() {
  const toast = useToastStore((s) => s.show);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([]);
  const [tierRows, setTierRows] = useState<TierRow[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId?: string }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // A free-tier backend waking from a cold start can easily take longer than
  // the 10s request timeout, which used to just dead-end on a raw "timeout of
  // 10000ms exceeded" message with no way to recover short of a page reload.
  // Back off across a few attempts before surfacing an error, mirroring the
  // homepage's category-list retry.
  const PRODUCTS_RETRY_DELAYS_MS = [1500, 3000, 5000];
  function loadProducts(attempt = 0) {
    setLoading(true);
    api
      .get("/products/mine")
      .then((res) => {
        setProducts(res.data.data.products);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (attempt < PRODUCTS_RETRY_DELAYS_MS.length) {
          setTimeout(() => loadProducts(attempt + 1), PRODUCTS_RETRY_DELAYS_MS[attempt]);
          return;
        }
        setError(apiErrorMessage(err));
        setLoading(false);
      });
  }

  useEffect(() => loadProducts(), []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSizeRows([]);
    setTierRows([]);
    setFiles(null);
    setExistingImages([]);
    setRemovedImageIds([]);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      colors: p.colors?.join(", ") || "",
      specifications: p.specifications || "",
      fabricType: p.fabricType || "",
      stock: String(p.stock),
      price: String(p.price),
      moq: String(p.moq),
    });
    setSizeRows((p.sizes || []).map((s) => ({ label: s.label, stock: String(s.stock) })));
    setTierRows((p.priceTiers || []).map((t) => ({ minQty: String(t.minQty), price: String(t.price) })));
    setFiles(null);
    setExistingImages(p.images || []);
    setRemovedImageIds([]);
    setFormError("");
    setShowForm(true);
  }

  function addSizeRow() {
    setSizeRows((prev) => [...prev, { label: "", stock: "" }]);
  }
  function updateSizeRow(i: number, field: keyof SizeRow, value: string) {
    setSizeRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function removeSizeRow(i: number) {
    setSizeRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addTierRow() {
    setTierRows((prev) => [...prev, { minQty: "", price: "" }]);
  }
  function updateTierRow(i: number, field: keyof TierRow, value: string) {
    setTierRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function removeTierRow(i: number) {
    setTierRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const validSizeRows = sizeRows.filter((r) => r.label.trim() !== "");
  const sizesStockTotal = validSizeRows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);

  function removeExistingImage(img: { url: string; publicId?: string }) {
    const key = img.publicId || img.url;
    setRemovedImageIds((prev) => [...prev, key]);
    setExistingImages((prev) => prev.filter((i) => (i.publicId || i.url) !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const usingSizes = validSizeRows.length > 0;

    if (
      !form.name ||
      !form.category ||
      !form.description ||
      !form.colors.trim() ||
      form.price === "" ||
      (!usingSizes && form.stock === "")
    ) {
      setFormError("Name, category, description, colors, price and stock are required");
      return;
    }
    if (Number(form.price) < 0 || (!usingSizes && Number(form.stock) < 0)) {
      setFormError("Price and stock cannot be negative");
      return;
    }
    if (usingSizes && validSizeRows.some((r) => Number(r.stock) < 0 || r.stock === "")) {
      setFormError("Each size needs a non-negative stock value");
      return;
    }
    const labels = validSizeRows.map((r) => r.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      setFormError("Size labels must be unique");
      return;
    }
    const validTierRows = tierRows.filter((r) => r.minQty !== "" && r.price !== "");
    if (validTierRows.some((r) => Number(r.minQty) < 1 || Number(r.price) < 0)) {
      setFormError("Each bulk pricing tier needs a quantity ≥ 1 and a non-negative price");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("colors", form.colors);
      fd.append("specifications", form.specifications);
      fd.append("fabricType", form.fabricType);
      // When sizes are in use, total stock is derived server-side from the
      // per-size counts — the value sent here is just a sane starting point.
      fd.append("stock", usingSizes ? String(sizesStockTotal) : form.stock);
      fd.append("price", form.price);
      fd.append("moq", form.moq);
      fd.append(
        "sizes",
        JSON.stringify(validSizeRows.map((r) => ({ label: r.label.trim(), stock: Number(r.stock) })))
      );
      fd.append(
        "priceTiers",
        JSON.stringify(validTierRows.map((r) => ({ minQty: Number(r.minQty), price: Number(r.price) })))
      );
      if (files) {
        Array.from(files).forEach((f) => fd.append("images", f));
      }
      if (editing && removedImageIds.length) {
        fd.append("removeImages", JSON.stringify(removedImageIds));
      }

      // Image uploads stream through the server to Cloudinary before the
      // response comes back, so this request naturally takes longer than a
      // plain JSON call — on top of that, a cold-starting free-tier backend
      // adds its own delay. The shared 10s client default is too tight for
      // that combination, so give this specific request more room.
      const uploadConfig = { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 };
      if (editing) {
        await api.put(`/products/${editing._id}`, fd, uploadConfig);
        toast("Product updated", "success");
      } else {
        await api.post("/products", fd, uploadConfig);
        toast("Product created", "success");
      }
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast("Product deleted", "success");
      loadProducts();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    }
  }

  async function toggleStock(p: Product) {
    try {
      const newStock = p.status === "available" ? 0 : p.stock > 0 ? p.stock : 10;
      await api.put(`/products/${p._id}`, { stock: newStock, status: newStock > 0 ? "available" : "out-of-stock" });
      toast(newStock > 0 ? "Marked as in stock" : "Marked as out of stock", "success");
      loadProducts();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    }
  }

  async function adjustStock(p: Product, delta: number) {
    const newStock = Math.max(0, p.stock + delta);
    const newStatus = newStock > 0 ? "available" : "out-of-stock";
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, stock: newStock, status: newStatus } : x)));
    try {
      await api.put(`/products/${p._id}`, { stock: newStock, status: newStatus });
    } catch (err) {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, stock: p.stock, status: p.status } : x)));
      toast(apiErrorMessage(err), "error");
    }
  }

  return (
    <>
      <Reveal>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Products</h1>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </Reveal>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : products.length === 0 ? (
        <div className="border rounded-xl bg-white p-10 text-center">
          <PackagePlus size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No products yet. Add your first product to get started.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="group border rounded-xl bg-white overflow-hidden flex flex-col hover:shadow-lg hover:border-teal-200 transition-shadow"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {p.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <span className="text-xs text-teal-600 uppercase font-medium">{p.category}</span>
                  <h3 className="font-medium">{p.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>${p.price.toFixed(2)}</span>
                    <span>·</span>
                    <span>Stock:</span>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => adjustStock(p, -10)}
                        aria-label="Decrease stock by 10"
                        className="border rounded p-0.5 hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-700">{p.stock}</span>
                      <button
                        onClick={() => adjustStock(p, 10)}
                        aria-label="Increase stock by 10"
                        className="border rounded p-0.5 hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <span
                    className={`text-xs w-fit px-2 py-0.5 rounded-full ${
                      p.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.status}
                  </span>
                  <div className="mt-auto pt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-sm border rounded-md py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => toggleStock(p)}
                      className="flex-1 text-sm border rounded-md py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      {p.status === "available" ? "Mark out of stock" : "Mark in stock"}
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-red-600 border rounded-md px-2 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-xl max-w-xl w-full my-4 sm:my-8 shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Header (fixed) */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0">
                  <h2 className="text-lg font-bold">{editing ? "Edit Product" : "Add Product"}</h2>
                  <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                    <X size={20} />
                  </button>
                </div>

                {/* Body (scrollable) */}
                <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-4 space-y-4">
                  <div>
                    <label htmlFor="p-name" className="block text-sm font-medium mb-1">
                      Product name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="p-name"
                      placeholder="e.g. Premium Cotton Twill"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="p-category" className="block text-sm font-medium mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="p-category"
                      placeholder="e.g. Fabrics"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="p-description" className="block text-sm font-medium mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="p-description"
                      placeholder="Describe the product"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={inputClass}
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="p-colors" className="block text-sm font-medium mb-1">
                      Colors <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="p-colors"
                      placeholder="Comma separated, e.g. Navy, White, Charcoal"
                      value={form.colors}
                      onChange={(e) => setForm({ ...form, colors: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="p-fabric" className="block text-sm font-medium mb-1">
                      Fabric type
                    </label>
                    <input
                      id="p-fabric"
                      placeholder="e.g. 100% Cotton"
                      value={form.fabricType}
                      onChange={(e) => setForm({ ...form, fabricType: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="p-specs" className="block text-sm font-medium mb-1">
                      Specifications
                    </label>
                    <input
                      id="p-specs"
                      placeholder="e.g. 180 GSM, 58 inch width"
                      value={form.specifications}
                      onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="p-price" className="block text-sm font-medium mb-1">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="p-price"
                        type="number"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="p-stock" className="block text-sm font-medium mb-1">
                        Stock {validSizeRows.length === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        id="p-stock"
                        type="number"
                        placeholder="0"
                        value={validSizeRows.length > 0 ? sizesStockTotal : form.stock}
                        disabled={validSizeRows.length > 0}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        className={`${inputClass} ${validSizeRows.length > 0 ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="p-moq" className="block text-sm font-medium mb-1">
                        MOQ
                      </label>
                      <input
                        id="p-moq"
                        type="number"
                        placeholder="1"
                        value={form.moq}
                        onChange={(e) => setForm({ ...form, moq: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {validSizeRows.length > 0 && (
                    <p className="text-xs text-gray-400 -mt-2">Stock is the sum of the sizes below.</p>
                  )}

                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Sizes (optional)</label>
                      <button
                        type="button"
                        onClick={addSizeRow}
                        className="text-xs inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <Plus size={12} /> Add size
                      </button>
                    </div>
                    {sizeRows.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        No sizes — this product sells by overall stock only. Add sizes if buyers must pick one (e.g.
                        apparel: S/M/L).
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 px-0.5">
                          <span className="flex-1">Label</span>
                          <span className="w-24">Stock</span>
                          <span className="w-4" />
                        </div>
                        {sizeRows.map((row, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              aria-label={`Size ${i + 1} label`}
                              placeholder="e.g. M"
                              value={row.label}
                              onChange={(e) => updateSizeRow(i, "label", e.target.value)}
                              className="border rounded-md px-2 py-1.5 text-sm flex-1"
                            />
                            <input
                              aria-label={`Size ${i + 1} stock`}
                              type="number"
                              placeholder="Stock"
                              min={0}
                              value={row.stock}
                              onChange={(e) => updateSizeRow(i, "stock", e.target.value)}
                              className="border rounded-md px-2 py-1.5 text-sm w-24"
                            />
                            <button
                              type="button"
                              onClick={() => removeSizeRow(i)}
                              aria-label="Remove size"
                              className="text-red-500 hover:text-red-700 shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Bulk pricing tiers (optional)</label>
                      <button
                        type="button"
                        onClick={addTierRow}
                        className="text-xs inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <Plus size={12} /> Add tier
                      </button>
                    </div>
                    {tierRows.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        No tiers — buyers always pay the base price above. Add tiers to discount larger orders (e.g.
                        100+ units at $4.50).
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 px-0.5">
                          <span className="flex-1">Min qty</span>
                          <span className="w-28">Price / unit</span>
                          <span className="w-4" />
                        </div>
                        {tierRows.map((row, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              aria-label={`Tier ${i + 1} minimum quantity`}
                              type="number"
                              placeholder="Min qty"
                              min={1}
                              value={row.minQty}
                              onChange={(e) => updateTierRow(i, "minQty", e.target.value)}
                              className="border rounded-md px-2 py-1.5 text-sm flex-1"
                            />
                            <input
                              aria-label={`Tier ${i + 1} price per unit`}
                              type="number"
                              step="0.01"
                              placeholder="Price / unit"
                              min={0}
                              value={row.price}
                              onChange={(e) => updateTierRow(i, "price", e.target.value)}
                              className="border rounded-md px-2 py-1.5 text-sm w-28"
                            />
                            <button
                              type="button"
                              onClick={() => removeTierRow(i)}
                              aria-label="Remove tier"
                              className="text-red-500 hover:text-red-700 shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {editing && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Current images</label>
                      {existingImages.length === 0 ? (
                        <p className="text-sm text-gray-400">No images yet — add some below.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {existingImages.map((img) => (
                            <div key={img.publicId || img.url} className="relative group aspect-square">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt="Product"
                                className="w-full h-full object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(img)}
                                aria-label="Remove image"
                                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="p-images" className="block text-sm font-medium mb-1">
                      {editing ? "Add more images" : "Images"}
                    </label>
                    <input
                      id="p-images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setFiles(e.target.files)}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                  </div>
                </div>

                {/* Footer (fixed) */}
                <div className="shrink-0 border-t px-5 sm:px-6 py-4 space-y-3">
                  {formError && <p className="text-red-600 text-sm">{formError}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 disabled:opacity-60 transition-colors"
                  >
                    {saving ? "Saving..." : editing ? "Save changes" : "Create product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function SupplierProductsPage() {
  return (
    <ProtectedRoute role="supplier">
      <DashboardLayout>
        <SupplierProductsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
