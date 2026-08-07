const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { ok, fail } = require("../utils/apiResponse");
const { cloudinary } = require("../config/cloudinary");

// priceTiers arrives as a JSON string over multipart form-data; validates that
// each tier has a positive minQty/price and that minQty is strictly increasing
// so "the highest qualifying tier wins" logic in utils/pricing.js stays sane.
function parsePriceTiers(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  let tiers;
  try {
    tiers = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("priceTiers must be valid JSON"), { statusCode: 400 });
  }
  if (!Array.isArray(tiers)) throw Object.assign(new Error("priceTiers must be an array"), { statusCode: 400 });

  const cleaned = tiers
    .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
    .filter((t) => Number.isFinite(t.minQty) && Number.isFinite(t.price));

  if (cleaned.some((t) => t.minQty < 1 || t.price < 0)) {
    throw Object.assign(new Error("priceTiers minQty must be >= 1 and price must not be negative"), {
      statusCode: 400,
    });
  }

  return cleaned.sort((a, b) => a.minQty - b.minQty);
}

// colors arrives as a comma-separated string (or an array) over multipart
// form-data, e.g. "Navy, White, Charcoal". Required: every product must list
// at least one available color.
function parseColors(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return list.map((c) => String(c).trim()).filter(Boolean);
}

// sizes arrives as a JSON string over multipart form-data, e.g.
// '[{"label":"M","stock":40},{"label":"L","stock":0}]'. Labels must be
// non-empty and unique (case-insensitive) so a buyer's size selection maps to
// exactly one inventory line.
function parseSizes(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  let sizes;
  try {
    sizes = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("sizes must be valid JSON"), { statusCode: 400 });
  }
  if (!Array.isArray(sizes)) throw Object.assign(new Error("sizes must be an array"), { statusCode: 400 });

  const cleaned = sizes
    .map((s) => ({ label: String(s.label || "").trim(), stock: Number(s.stock) }))
    .filter((s) => s.label !== "");

  if (cleaned.some((s) => !Number.isFinite(s.stock) || s.stock < 0)) {
    throw Object.assign(new Error("Each size's stock must be a non-negative number"), { statusCode: 400 });
  }
  const labels = cleaned.map((s) => s.label.toLowerCase());
  if (new Set(labels).size !== labels.length) {
    throw Object.assign(new Error("Size labels must be unique"), { statusCode: 400 });
  }

  return cleaned;
}

exports.createProduct = async (req, res) => {
  const { name, category, description, colors, specifications, fabricType, stock, price, moq } = req.body;

  if (!name || !category || !description || price === undefined || stock === undefined) {
    return fail(res, "name, category, description, price and stock are required", 400);
  }
  if (Number(price) < 0 || Number(stock) < 0) {
    return fail(res, "price and stock must not be negative", 400);
  }

  const cleanedColors = parseColors(colors);
  if (cleanedColors.length === 0) {
    return fail(res, "At least one color is required", 400);
  }

  let priceTiers;
  let sizes;
  try {
    priceTiers = parsePriceTiers(req.body.priceTiers);
    sizes = parseSizes(req.body.sizes);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 400);
  }

  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

  const product = await Product.create({
    supplierId: req.user._id,
    name,
    category,
    description,
    colors: cleanedColors,
    specifications,
    fabricType,
    stock: Number(stock),
    price: Number(price),
    moq: moq ? Number(moq) : 1,
    priceTiers,
    sizes,
    images,
    status: Number(stock) > 0 ? "available" : "out-of-stock",
  });

  return ok(res, { product }, "Product created", 201);
};

exports.listProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, fabricType, supplierId, status, ids, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (fabricType) query.fabricType = fabricType;
  if (supplierId) query.supplierId = supplierId;
  if (status) query.status = status;
  if (ids) {
    const idList = String(ids)
      .split(",")
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    query._id = { $in: idList };
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  return ok(res, { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("supplierId", "name supplierProfile");
  if (!product) return fail(res, "Product not found", 404);
  return ok(res, { product });
};

exports.getCategories = async (req, res) => {
  const categories = await Product.distinct("category");
  return ok(res, { categories });
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);
  if (String(product.supplierId) !== String(req.user._id)) {
    return fail(res, "Forbidden: not your product", 403);
  }

  const fields = ["name", "category", "description", "specifications", "fabricType", "stock", "price", "moq", "status"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  if (req.body.colors !== undefined) {
    const cleanedColors = parseColors(req.body.colors);
    if (cleanedColors.length === 0) {
      return fail(res, "At least one color is required", 400);
    }
    product.colors = cleanedColors;
  }
  if (req.body.priceTiers !== undefined) {
    try {
      product.priceTiers = parsePriceTiers(req.body.priceTiers);
    } catch (err) {
      return fail(res, err.message, err.statusCode || 400);
    }
  }
  if (req.body.sizes !== undefined) {
    try {
      product.sizes = parseSizes(req.body.sizes);
    } catch (err) {
      return fail(res, err.message, err.statusCode || 400);
    }
  }

  if (req.body.removeImages) {
    let removeIds;
    try {
      removeIds = Array.isArray(req.body.removeImages) ? req.body.removeImages : JSON.parse(req.body.removeImages);
    } catch {
      removeIds = String(req.body.removeImages).split(",").map((s) => s.trim());
    }
    // Images are keyed by publicId when available (uploaded via Cloudinary), falling
    // back to their url for older/seeded images that don't have one.
    const matches = (img) => removeIds.includes(img.publicId) || removeIds.includes(img.url);
    const toRemove = product.images.filter(matches);
    product.images = product.images.filter((img) => !matches(img));
    // Best-effort cleanup on Cloudinary; a failure here shouldn't block saving the product.
    Promise.all(toRemove.filter((img) => img.publicId).map((img) => cloudinary.uploader.destroy(img.publicId))).catch(
      () => {}
    );
  }

  if (req.files && req.files.length) {
    const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    product.images = [...product.images, ...newImages];
  }
  if (req.body.stock !== undefined) {
    product.status = Number(req.body.stock) > 0 ? "available" : "out-of-stock";
  }

  await product.save();
  return ok(res, { product }, "Product updated");
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);
  if (String(product.supplierId) !== String(req.user._id)) {
    return fail(res, "Forbidden: not your product", 403);
  }
  await product.deleteOne();
  return ok(res, null, "Product deleted");
};

exports.myProducts = async (req, res) => {
  const products = await Product.find({ supplierId: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { products });
};

// Aggregates real order history (units sold) to rank products, rather than a
// hardcoded/static "featured" list — keeps the homepage's "Best Sellers" honest.
exports.bestSellers = async (req, res) => {
  const { limit = 8, supplierId } = req.query;
  const take = Number(limit) || 8;

  const pipeline = [{ $unwind: "$items" }];
  if (supplierId) {
    pipeline.push({ $match: { "items.supplierId": new mongoose.Types.ObjectId(supplierId) } });
  }
  pipeline.push(
    { $group: { _id: "$items.productId", totalSold: { $sum: "$items.quantity" } } },
    { $sort: { totalSold: -1 } },
    { $limit: take * 2 } // fetch extra headroom in case a sold product was since deleted
  );

  const results = await Order.aggregate(pipeline);
  if (!results.length) return ok(res, { products: [] });

  const soldMap = new Map(results.map((r) => [String(r._id), r.totalSold]));
  const products = await Product.find({ _id: { $in: results.map((r) => r._id) }, status: "available" });

  const ranked = products
    .map((p) => ({ ...p.toObject(), totalSold: soldMap.get(String(p._id)) || 0 }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, take);

  return ok(res, { products: ranked });
};
