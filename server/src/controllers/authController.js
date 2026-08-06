const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { ok, fail } = require("../utils/apiResponse");
const { sendEmail } = require("../config/email");
const { verificationEmail, passwordResetEmail } = require("../utils/emailTemplates");

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

async function sendVerificationEmail(user) {
  const { token, hash } = createToken();
  user.emailVerificationTokenHash = hash;
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your TextileHub email",
    html: verificationEmail(user.name, verifyUrl),
  }).catch((err) => console.error("Failed to send verification email", err));
}

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  setRefreshCookie(res, signRefreshToken(user));
  return accessToken;
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return fail(res, "name, email, password and role are required", 400);
  }
  if (!["buyer", "supplier"].includes(role)) {
    return fail(res, "role must be buyer or supplier", 400);
  }
  if (password.length < 6) {
    return fail(res, "password must be at least 6 characters", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return fail(res, "Email already registered", 409);

  const user = await User.create({ name, email, password, role });
  await sendVerificationEmail(user);

  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeObject(), token: accessToken }, "Registered successfully", 201);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "email and password are required", 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return fail(res, "Invalid credentials", 401);

  const match = await user.comparePassword(password);
  if (!match) return fail(res, "Invalid credentials", 401);

  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeObject(), token: accessToken }, "Logged in successfully");
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) return fail(res, "No refresh token", 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return fail(res, "Invalid or expired refresh token", 401);
  }
  if (decoded.type !== "refresh") return fail(res, "Invalid token type", 401);

  const user = await User.findById(decoded.id);
  if (!user) return fail(res, "User not found", 401);

  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeObject(), token: accessToken }, "Token refreshed");
};

exports.logout = async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  return ok(res, null, "Logged out");
};

exports.me = async (req, res) => {
  return ok(res, { user: req.user.toSafeObject() }, "Current user");
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) return fail(res, "token is required", 400);

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) return fail(res, "Invalid or expired verification link", 400);

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return ok(res, { user: user.toSafeObject() }, "Email verified");
};

exports.resendVerification = async (req, res) => {
  if (req.user.isEmailVerified) return fail(res, "Email is already verified", 400);

  await sendVerificationEmail(req.user);
  return ok(res, null, "Verification email sent");
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, "email is required", 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    const { token, hash } = createToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your TextileHub password",
      html: passwordResetEmail(user.name, resetUrl),
    }).catch((err) => console.error("Failed to send password reset email", err));
  }

  // Always respond the same way so we don't leak which emails are registered.
  return ok(res, null, "If that email is registered, a reset link has been sent");
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return fail(res, "token and newPassword are required", 400);
  if (newPassword.length < 6) return fail(res, "newPassword must be at least 6 characters", 400);

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) return fail(res, "Invalid or expired reset link", 400);

  user.password = newPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return ok(res, null, "Password reset successfully");
};
