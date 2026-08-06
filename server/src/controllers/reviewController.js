const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { ok, fail } = require("../utils/apiResponse");

async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats[0]?.avg || 0;
  const numReviews = stats[0]?.count || 0;
  await Product.findByIdAndUpdate(productId, { avgRating: Math.round(avgRating * 10) / 10, numReviews });
}

exports.listReviews = async (req, res) => {
  const reviews = await Review.find({ productId: req.params.id })
    .populate("buyerId", "name")
    .sort({ createdAt: -1 });
  return ok(res, { reviews });
};

exports.upsertReview = async (req, res) => {
  const { rating, comment } = req.body;
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return fail(res, "rating must be between 1 and 5", 400);
  }

  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);

  const review = await Review.findOneAndUpdate(
    { productId: req.params.id, buyerId: req.user._id },
    { rating: numericRating, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recomputeProductRating(req.params.id);
  return ok(res, { review }, "Review saved");
};

exports.deleteReview = async (req, res) => {
  const review = await Review.findOneAndDelete({ productId: req.params.id, buyerId: req.user._id });
  if (!review) return fail(res, "Review not found", 404);

  await recomputeProductRating(req.params.id);
  return ok(res, null, "Review deleted");
};
