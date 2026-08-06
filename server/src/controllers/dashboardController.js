const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Quote = require("../models/Quote");
const { ok } = require("../utils/apiResponse");

exports.supplierStats = async (req, res) => {
  const supplierId = req.user._id;

  const [totalProducts, activeProducts, lowStock, orders, pendingQuotes] = await Promise.all([
    Product.countDocuments({ supplierId }),
    Product.countDocuments({ supplierId, status: "available" }),
    Product.countDocuments({ supplierId, stock: { $lte: 5, $gt: 0 } }),
    Order.find({ "items.supplierId": supplierId }).sort({ createdAt: -1 }),
    Quote.countDocuments({ supplierId, status: "Pending" }),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const recentOrders = orders.slice(0, 5);
  const ordersPerWeek = buildWeeklySeries(orders, supplierId, 8);

  return ok(res, {
    totalProducts,
    activeProducts,
    pendingOrders,
    pendingQuotes,
    inventoryAlerts: lowStock,
    recentOrders,
    ordersPerWeek,
  });
};

exports.buyerStats = async (req, res) => {
  const buyerId = req.user._id;

  const [orders, user, openQuotes] = await Promise.all([
    Order.find({ buyerId }).sort({ createdAt: -1 }),
    User.findById(buyerId).select("wishlist"),
    Quote.countDocuments({ buyerId, status: { $in: ["Pending", "Responded"] } }),
  ]);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "Completed").length;
  const activeOrders = totalOrders - completedOrders;
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const spendPerMonth = buildMonthlySpend(orders, 6);

  return ok(res, {
    totalOrders,
    activeOrders,
    completedOrders,
    totalSpent: Math.round(totalSpent * 100) / 100,
    wishlistCount: user?.wishlist?.length || 0,
    openQuotes,
    recentOrders: orders.slice(0, 5),
    spendPerMonth,
  });
};

function buildMonthlySpend(orders, months) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: d.toLocaleString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), spend: 0 });
  }
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) bucket.spend += o.totalAmount;
  });
  return buckets.map((b) => ({ label: b.label, spend: Math.round(b.spend * 100) / 100 }));
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function buildWeeklySeries(orders, supplierId, weeks) {
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    buckets.push({ weekStart, orders: 0, revenue: 0 });
  }

  orders.forEach((order) => {
    const myItems = order.items.filter((i) => String(i.supplierId) === String(supplierId));
    if (!myItems.length) return;

    const orderWeekStart = startOfWeek(order.createdAt).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === orderWeekStart);
    if (!bucket) return;

    bucket.orders += 1;
    bucket.revenue += myItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  });

  return buckets.map((b) => ({
    weekStart: b.weekStart.toISOString().slice(0, 10),
    orders: b.orders,
    revenue: Math.round(b.revenue * 100) / 100,
  }));
}
