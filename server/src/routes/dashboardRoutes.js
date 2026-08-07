const express = require("express");
const asyncHandler = require("express-async-handler");
const { supplierStats, buyerStats, adminStats } = require("../controllers/dashboardController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/supplier", protect, requireRole("supplier"), asyncHandler(supplierStats));
router.get("/buyer", protect, requireRole("buyer"), asyncHandler(buyerStats));
router.get("/admin", protect, requireRole("admin"), asyncHandler(adminStats));

module.exports = router;
