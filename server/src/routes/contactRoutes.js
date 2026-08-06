const express = require("express");
const asyncHandler = require("express-async-handler");
const { submitContact } = require("../controllers/contactController");

const router = express.Router();

router.post("/", asyncHandler(submitContact));

module.exports = router;
