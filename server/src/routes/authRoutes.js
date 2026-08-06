const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  register,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
router.get("/me", protect, asyncHandler(me));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/resend-verification", protect, asyncHandler(resendVerification));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

module.exports = router;
