const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: user.suspendedReason
          ? `Your account has been suspended: ${user.suspendedReason}`
          : "Your account has been suspended. Contact support for details.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
    }
    next();
  };
}

// Blocks marketplace actions (adding/selling products, placing/fulfilling
// orders) until the account's email is verified. Must run after `protect`.
function requireEmailVerified(req, res, next) {
  if (!req.user || !req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address before doing this.",
      errors: { code: "EMAIL_NOT_VERIFIED" },
    });
  }
  next();
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.type || decoded.type === "access") {
      req.user = await User.findById(decoded.id);
    }
  } catch {
    // ignore invalid/expired token for optional auth
  }
  next();
}

module.exports = { protect, requireRole, requireEmailVerified, optionalAuth };
