const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    image: String,
    size: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingInfo: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
      notes: String,
    },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Preparing", "Ready for Dispatch", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
