const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  createQuote,
  myQuotes,
  incomingQuotes,
  respondQuote,
  updateQuoteStatus,
} = require("../controllers/quoteController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requireRole("buyer"), asyncHandler(createQuote));
router.get("/mine", protect, requireRole("buyer"), asyncHandler(myQuotes));
router.get("/incoming", protect, requireRole("supplier"), asyncHandler(incomingQuotes));
router.put("/:id/respond", protect, requireRole("supplier"), asyncHandler(respondQuote));
router.put("/:id/status", protect, requireRole("buyer"), asyncHandler(updateQuoteStatus));

module.exports = router;
