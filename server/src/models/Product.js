const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    colors: [String],
    specifications: { type: String },
    fabricType: String,
    stock: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    moq: { type: Number, default: 1, min: 1 },
    // Optional bulk-pricing breaks, e.g. [{minQty:100, price:4.5},{minQty:500, price:3.9}].
    // Sorted ascending by minQty; the highest tier whose minQty <= order quantity applies.
    priceTiers: [{ minQty: { type: Number, min: 1 }, price: { type: Number, min: 0 }, _id: false }],
    // Optional per-size inventory, e.g. [{label:"M", stock:40},{label:"L", stock:0}].
    // When present, this is the source of truth for `stock`/`status` (see pre-save
    // hook below) — buyers pick a size and can never order more than that size has.
    sizes: [{ label: { type: String, trim: true }, stock: { type: Number, min: 0, default: 0 }, _id: false }],
    images: [{ url: String, publicId: String }],
    status: { type: String, enum: ["available", "out-of-stock"], default: "available" },
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text" });

// Keep aggregate stock/status in sync with per-size inventory whenever sizes
// are used, so every other query (search filters, low-stock alerts, cart
// checks) that only looks at top-level `stock` still works unmodified.
productSchema.pre("save", function () {
  if (this.sizes && this.sizes.length) {
    this.stock = this.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
    this.status = this.stock > 0 ? "available" : "out-of-stock";
  }
});

module.exports = mongoose.model("Product", productSchema);
