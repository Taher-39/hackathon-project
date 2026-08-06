const express = require("express");
const asyncHandler = require("express-async-handler");
const { getSupplierProfile } = require("../controllers/supplierController");

const router = express.Router();

router.get("/:id", asyncHandler(getSupplierProfile));

module.exports = router;
