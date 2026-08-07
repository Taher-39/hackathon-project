const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  listBuyers,
  listSuppliers,
  listAdmins,
  getUserDetail,
  setSupplierVerification,
  suspendUser,
  reactivateUser,
  changeRole,
  listOrders,
  listAuditLog,
} = require("../controllers/adminController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/buyers", asyncHandler(listBuyers));
router.get("/suppliers", asyncHandler(listSuppliers));
router.get("/admins", asyncHandler(listAdmins));
router.get("/users/:id", asyncHandler(getUserDetail));
router.put("/suppliers/:id/verification", asyncHandler(setSupplierVerification));
router.put("/users/:id/suspend", asyncHandler(suspendUser));
router.put("/users/:id/reactivate", asyncHandler(reactivateUser));
router.put("/users/:id/role", asyncHandler(changeRole));
router.get("/orders", asyncHandler(listOrders));
router.get("/audit-log", asyncHandler(listAuditLog));

module.exports = router;
