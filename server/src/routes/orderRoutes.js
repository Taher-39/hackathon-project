const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  createOrder,
  myOrders,
  getOrder,
  supplierOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requireRole("buyer"), asyncHandler(createOrder));
router.get("/mine", protect, requireRole("buyer"), asyncHandler(myOrders));
router.get("/supplier", protect, requireRole("supplier"), asyncHandler(supplierOrders));
router.get("/:id", protect, asyncHandler(getOrder));
router.patch("/:id/status", protect, requireRole("supplier"), asyncHandler(updateOrderStatus));

module.exports = router;
