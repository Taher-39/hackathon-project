const express = require("express");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const {
  createProduct,
  listProducts,
  getProduct,
  getCategories,
  updateProduct,
  deleteProduct,
  myProducts,
  bestSellers,
} = require("../controllers/productController");
const { listReviews, upsertReview, deleteReview } = require("../controllers/reviewController");
const { protect, requireRole, requireEmailVerified } = require("../middleware/auth");

const upload = multer({ storage });
const router = express.Router();

router.get("/", asyncHandler(listProducts));
router.get("/categories", asyncHandler(getCategories));
router.get("/best-sellers", asyncHandler(bestSellers));
router.get("/mine", protect, requireRole("supplier"), asyncHandler(myProducts));
router.get("/:id", asyncHandler(getProduct));
router.get("/:id/reviews", asyncHandler(listReviews));

router.post(
  "/",
  protect,
  requireRole("supplier"),
  requireEmailVerified,
  upload.array("images", 5),
  asyncHandler(createProduct)
);
router.post("/:id/reviews", protect, requireRole("buyer"), asyncHandler(upsertReview));
router.put(
  "/:id",
  protect,
  requireRole("supplier"),
  requireEmailVerified,
  upload.array("images", 5),
  asyncHandler(updateProduct)
);
router.delete("/:id", protect, requireRole("supplier"), requireEmailVerified, asyncHandler(deleteProduct));
router.delete("/:id/reviews", protect, requireRole("buyer"), asyncHandler(deleteReview));

module.exports = router;
