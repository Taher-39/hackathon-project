const mongoose = require("mongoose");

// A "Request for Quote" (RFQ) — lets a buyer ask a supplier for custom bulk
// pricing on a product instead of just checking out at the listed price.
// Distinct from Order: no shipping/payment, just a price negotiation thread.
const quoteSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: String,
    quantity: { type: Number, required: true, min: 1 },
    targetPrice: { type: Number, min: 0 },
    message: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["Pending", "Responded", "Accepted", "Declined"],
      default: "Pending",
    },
    response: {
      price: { type: Number, min: 0 },
      message: { type: String, trim: true, maxlength: 1000 },
      respondedAt: Date,
    },
  },
  { timestamps: true }
);

quoteSchema.index({ buyerId: 1, createdAt: -1 });
quoteSchema.index({ supplierId: 1, createdAt: -1 });

module.exports = mongoose.model("Quote", quoteSchema);
