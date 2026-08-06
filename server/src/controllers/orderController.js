const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const { ok, fail } = require("../utils/apiResponse");
const { effectiveUnitPrice } = require("../utils/pricing");

exports.createOrder = async (req, res) => {
  const { items, shippingInfo } = req.body;
  if (!items || !items.length) return fail(res, "Order must contain at least one item", 400);
  if (!shippingInfo || !shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
    return fail(res, "shippingInfo (fullName, phone, address) is required", 400);
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== productIds.length) return fail(res, "One or more products not found", 404);

  // Same product can appear more than once in the cart (different sizes), so
  // mutate the fetched docs in-memory and save each one only once at the end.
  const touchedProducts = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = items.map((i) => {
    const product = touchedProducts.get(String(i.productId));
    if (i.quantity < 1) throw Object.assign(new Error("Quantity must be at least 1"), { statusCode: 400 });

    if (product.sizes && product.sizes.length) {
      if (!i.size) {
        throw Object.assign(new Error(`A size is required for ${product.name}`), { statusCode: 400 });
      }
      const sizeEntry = product.sizes.find((s) => s.label.toLowerCase() === String(i.size).toLowerCase());
      if (!sizeEntry) {
        throw Object.assign(new Error(`Size "${i.size}" is not available for ${product.name}`), { statusCode: 400 });
      }
      if (i.quantity > sizeEntry.stock) {
        throw Object.assign(
          new Error(`Only ${sizeEntry.stock} unit(s) left in size ${sizeEntry.label} for ${product.name}`),
          { statusCode: 400 }
        );
      }
      sizeEntry.stock -= i.quantity;
    } else if (i.quantity > product.stock) {
      throw Object.assign(new Error(`Only ${product.stock} unit(s) of ${product.name} in stock`), {
        statusCode: 400,
      });
    } else {
      product.stock -= i.quantity;
      if (product.stock <= 0) product.status = "out-of-stock";
    }

    return {
      productId: product._id,
      supplierId: product.supplierId,
      name: product.name,
      image: product.images[0]?.url,
      size: i.size || undefined,
      // Bulk-tier pricing is re-derived server-side from live product data —
      // never trust a client-supplied unit price for the charged amount.
      price: effectiveUnitPrice(product, i.quantity),
      quantity: i.quantity,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    buyerId: req.user._id,
    items: orderItems,
    shippingInfo,
    totalAmount,
  });

  // Persist the stock decrements only after the order itself is confirmed created.
  await Promise.all([...touchedProducts.values()].map((p) => p.save()));

  const supplierIds = [...new Set(orderItems.map((i) => String(i.supplierId)))];
  await Notification.insertMany(
    supplierIds.map((supplierId) => ({
      userId: supplierId,
      type: "new_order",
      message: `New order #${String(order._id).slice(-6).toUpperCase()} received ($${totalAmount.toFixed(2)})`,
      link: "/dashboard/supplier/orders",
    }))
  );

  return ok(res, { order }, "Order placed successfully", 201);
};

exports.myOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = { buyerId: req.user._id };

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  return ok(res, { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};

exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, "Order not found", 404);

  const isBuyer = String(order.buyerId) === String(req.user._id);
  const isSupplierOnOrder = order.items.some((i) => String(i.supplierId) === String(req.user._id));
  if (!isBuyer && !isSupplierOnOrder) return fail(res, "Forbidden", 403);

  return ok(res, { order });
};

exports.supplierOrders = async (req, res) => {
  const orders = await Order.find({ "items.supplierId": req.user._id }).sort({ createdAt: -1 });
  return ok(res, { orders });
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "Accepted", "Preparing", "Ready for Dispatch", "Completed"];
  if (!allowed.includes(status)) return fail(res, "Invalid status value", 400);

  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, "Order not found", 404);

  const isSupplierOnOrder = order.items.some((i) => String(i.supplierId) === String(req.user._id));
  if (!isSupplierOnOrder) return fail(res, "Forbidden: not your order", 403);

  order.status = status;
  await order.save();

  await Notification.create({
    userId: order.buyerId,
    type: "order_status",
    message: `Your order #${String(order._id).slice(-6).toUpperCase()} is now "${status}"`,
    link: "/dashboard/buyer",
  });

  return ok(res, { order }, "Order status updated");
};
