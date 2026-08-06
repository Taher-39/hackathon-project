const Quote = require("../models/Quote");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const { ok, fail } = require("../utils/apiResponse");

// Buyer requests custom bulk pricing on a product.
exports.createQuote = async (req, res) => {
  const { productId, quantity, targetPrice, message } = req.body;
  if (!productId || !quantity) return fail(res, "productId and quantity are required", 400);
  if (Number(quantity) < 1) return fail(res, "quantity must be at least 1", 400);
  if (targetPrice !== undefined && targetPrice !== null && targetPrice !== "" && Number(targetPrice) < 0) {
    return fail(res, "targetPrice must not be negative", 400);
  }

  const product = await Product.findById(productId);
  if (!product) return fail(res, "Product not found", 404);

  const quote = await Quote.create({
    buyerId: req.user._id,
    supplierId: product.supplierId,
    productId: product._id,
    productName: product.name,
    productImage: product.images?.[0]?.url,
    quantity: Number(quantity),
    targetPrice: targetPrice !== undefined && targetPrice !== "" ? Number(targetPrice) : undefined,
    message,
  });

  await Notification.create({
    userId: product.supplierId,
    type: "new_quote",
    message: `New quote request for ${product.name} (qty ${quantity}) from ${req.user.name}`,
    link: "/dashboard/supplier/quotes",
  });

  return ok(res, { quote }, "Quote request sent", 201);
};

exports.myQuotes = async (req, res) => {
  const quotes = await Quote.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { quotes });
};

exports.incomingQuotes = async (req, res) => {
  const quotes = await Quote.find({ supplierId: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { quotes });
};

// Supplier responds with a custom price + message.
exports.respondQuote = async (req, res) => {
  const { price, message } = req.body;
  if (price === undefined || price === null || price === "") return fail(res, "price is required", 400);
  if (Number(price) < 0) return fail(res, "price must not be negative", 400);

  const quote = await Quote.findById(req.params.id);
  if (!quote) return fail(res, "Quote not found", 404);
  if (String(quote.supplierId) !== String(req.user._id)) return fail(res, "Forbidden: not your quote", 403);
  if (quote.status === "Accepted" || quote.status === "Declined") {
    return fail(res, `Quote already ${quote.status.toLowerCase()}`, 400);
  }

  quote.response = { price: Number(price), message, respondedAt: new Date() };
  quote.status = "Responded";
  await quote.save();

  await Notification.create({
    userId: quote.buyerId,
    type: "quote_response",
    message: `Supplier responded to your quote for ${quote.productName}: $${Number(price).toFixed(2)}/unit`,
    link: "/dashboard/buyer/quotes",
  });

  return ok(res, { quote }, "Response sent");
};

// Buyer accepts or declines a supplier's response.
exports.updateQuoteStatus = async (req, res) => {
  const { status } = req.body;
  if (!["Accepted", "Declined"].includes(status)) return fail(res, "status must be Accepted or Declined", 400);

  const quote = await Quote.findById(req.params.id);
  if (!quote) return fail(res, "Quote not found", 404);
  if (String(quote.buyerId) !== String(req.user._id)) return fail(res, "Forbidden: not your quote", 403);
  if (quote.status !== "Responded") return fail(res, "Quote must be responded to first", 400);

  quote.status = status;
  await quote.save();

  await Notification.create({
    userId: quote.supplierId,
    type: "quote_status",
    message: `Buyer ${status.toLowerCase()} your quote for ${quote.productName}`,
    link: "/dashboard/supplier/quotes",
  });

  return ok(res, { quote }, `Quote ${status.toLowerCase()}`);
};
