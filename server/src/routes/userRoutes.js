const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  onboardBuyer,
  onboardSupplier,
  getWishlist,
  toggleWishlist,
  updateAddress,
  changePassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/onboarding/buyer", protect, asyncHandler(onboardBuyer));
router.post("/onboarding/supplier", protect, asyncHandler(onboardSupplier));
router.get("/wishlist", protect, asyncHandler(getWishlist));
router.post("/wishlist/:productId", protect, asyncHandler(toggleWishlist));
router.put("/address", protect, asyncHandler(updateAddress));
router.put("/change-password", protect, asyncHandler(changePassword));

module.exports = router;
