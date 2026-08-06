const express = require("express");
const asyncHandler = require("express-async-handler");
const { listNotifications, markRead, markAllRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, asyncHandler(listNotifications));
router.patch("/:id/read", protect, asyncHandler(markRead));
router.patch("/read-all", protect, asyncHandler(markAllRead));

module.exports = router;
