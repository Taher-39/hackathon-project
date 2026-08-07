const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Quote = require("../models/Quote");
const AuditLog = require("../models/AuditLog");
const { ok, fail } = require("../utils/apiResponse");

function writeAudit(req, { action, targetType, targetId, targetLabel, details }) {
  return AuditLog.create({
    actorId: req.user._id,
    actorName: req.user.name,
    action,
    targetType,
    targetId,
    targetLabel,
    details,
  });
}

async function listUsers(role, req, res) {
  const { search, status, verified, page = 1, limit = 20 } = req.query;
  const query = { role };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (status && ["active", "suspended"].includes(status)) query.status = status;
  if (role === "supplier" && verified !== undefined) {
    query["supplierProfile.isVerified"] = verified === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select("-password"),
    User.countDocuments(query),
  ]);

  return ok(res, { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
}

exports.listBuyers = (req, res) => listUsers("buyer", req, res);
exports.listSuppliers = (req, res) => listUsers("supplier", req, res);
exports.listAdmins = (req, res) => listUsers("admin", req, res);

exports.getUserDetail = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return fail(res, "User not found", 404);

  const isSupplier = user.role === "supplier";
  const [orders, quotes, productCount] = await Promise.all([
    isSupplier
      ? Order.find({ "items.supplierId": user._id }).sort({ createdAt: -1 }).limit(10)
      : Order.find({ buyerId: user._id }).sort({ createdAt: -1 }).limit(10),
    isSupplier
      ? Quote.countDocuments({ supplierId: user._id })
      : Quote.countDocuments({ buyerId: user._id }),
    isSupplier ? Product.countDocuments({ supplierId: user._id }) : Promise.resolve(undefined),
  ]);

  return ok(res, { user, recentOrders: orders, quoteCount: quotes, productCount });
};

exports.setSupplierVerification = async (req, res) => {
  const { verified } = req.body;
  if (typeof verified !== "boolean") return fail(res, "verified (boolean) is required", 400);

  const user = await User.findById(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  if (user.role !== "supplier") return fail(res, "User is not a supplier", 400);

  user.supplierProfile = user.supplierProfile || {};
  user.supplierProfile.isVerified = verified;
  await user.save();

  await writeAudit(req, {
    action: verified ? "supplier.verify" : "supplier.unverify",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.supplierProfile.businessName || user.name,
  });

  return ok(res, { user: user.toSafeObject() }, verified ? "Supplier verified" : "Supplier verification removed");
};

exports.suspendUser = async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  if (user.isProtected) return fail(res, "This account is protected and can't be modified", 400);
  if (user.role === "admin") return fail(res, "Admins can't be suspended from here", 400);
  if (String(user._id) === String(req.user._id)) return fail(res, "You can't suspend your own account", 400);

  user.status = "suspended";
  user.suspendedReason = reason || "";
  await user.save();

  await writeAudit(req, {
    action: "user.suspend",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.name,
    details: reason || undefined,
  });

  return ok(res, { user: user.toSafeObject() }, "Account suspended");
};

exports.reactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, "User not found", 404);

  user.status = "active";
  user.suspendedReason = undefined;
  await user.save();

  await writeAudit(req, {
    action: "user.reactivate",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.name,
  });

  return ok(res, { user: user.toSafeObject() }, "Account reactivated");
};

const ROLES = ["buyer", "supplier", "admin"];

// Generic role change — covers promoting a buyer/supplier to admin as well as
// demoting an admin back down. The seeded demo admin (isProtected) can never
// be the target here, by anyone, including other admins; that's what keeps
// it a stable, always-available demo login.
exports.changeRole = async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return fail(res, "role must be buyer, supplier, or admin", 400);

  const user = await User.findById(req.params.id);
  if (!user) return fail(res, "User not found", 404);
  if (user.isProtected) return fail(res, "This account is protected and can't be modified", 400);
  if (String(user._id) === String(req.user._id)) return fail(res, "You can't change your own role", 400);
  if (user.role === role) return fail(res, `User is already ${role === "admin" ? "an" : "a"} ${role}`, 400);

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await writeAudit(req, {
    action: "user.role_change",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.name,
    details: `${previousRole} -> ${role}`,
  });

  return ok(res, { user: user.toSafeObject() }, `Role changed to ${role}`);
};

exports.listOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("buyerId", "name email"),
    Order.countDocuments(query),
  ]);

  const shaped = orders.map((order) => {
    const platformFee = order.items.reduce((sum, i) => sum + (i.platformFee || 0), 0);
    return {
      _id: order._id,
      buyerName: order.buyerId?.name || "Unknown buyer",
      buyerEmail: order.buyerId?.email,
      itemCount: order.items.length,
      totalAmount: order.totalAmount,
      platformFee: Math.round(platformFee * 100) / 100,
      status: order.status,
      createdAt: order.createdAt,
    };
  });

  return ok(res, { orders: shaped, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};

exports.listAuditLog = async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [entries, total] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(),
  ]);

  return ok(res, { entries, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};
