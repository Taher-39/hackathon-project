const User = require("../models/User");
const Product = require("../models/Product");
const { ok, fail } = require("../utils/apiResponse");

// Public supplier storefront: business profile + aggregate rating across their
// catalog. No auth required — buyers should be able to browse a supplier's
// profile the same way they browse products.
exports.getSupplierProfile = async (req, res) => {
  const supplier = await User.findOne({ _id: req.params.id, role: "supplier" }).select(
    "name email supplierProfile createdAt"
  );
  if (!supplier) return fail(res, "Supplier not found", 404);

  const [productCount, ratingAgg] = await Promise.all([
    Product.countDocuments({ supplierId: supplier._id }),
    Product.aggregate([
      { $match: { supplierId: supplier._id, numReviews: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$avgRating" }, totalReviews: { $sum: "$numReviews" } } },
    ]),
  ]);

  return ok(res, {
    supplier: {
      _id: supplier._id,
      name: supplier.name,
      supplierProfile: supplier.supplierProfile,
      memberSince: supplier.createdAt,
    },
    productCount,
    avgRating: Math.round((ratingAgg[0]?.avg || 0) * 10) / 10,
    totalReviews: ratingAgg[0]?.totalReviews || 0,
  });
};
