const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  chat,
  recommendations,
  compare,
  similar,
  productQna,
  onboardingAutofill,
} = require("../controllers/assistantController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/chat", optionalAuth, asyncHandler(chat));
router.get("/recommendations", protect, asyncHandler(recommendations));
router.post("/compare", asyncHandler(compare));
router.get("/similar/:productId", asyncHandler(similar));
router.post("/product-qna/:productId", optionalAuth, asyncHandler(productQna));
router.post("/onboarding-autofill", protect, asyncHandler(onboardingAutofill));

module.exports = router;
