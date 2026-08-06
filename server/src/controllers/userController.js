const User = require("../models/User");
const Product = require("../models/Product");
const { ok, fail } = require("../utils/apiResponse");

exports.onboardBuyer = async (req, res) => {
  if (req.user.role !== "buyer") return fail(res, "Only buyers can access this", 403);

  const { businessType, industry, productCategories, fabricTypes, typicalOrderQuantity, budgetRange } = req.body;
  if (!businessType || !industry) {
    return fail(res, "businessType and industry are required", 400);
  }

  req.user.buyerProfile = {
    businessType,
    industry,
    productCategories: productCategories || [],
    fabricTypes: fabricTypes || [],
    typicalOrderQuantity,
    budgetRange,
  };
  req.user.isOnboarded = true;
  await req.user.save();

  return ok(res, { user: req.user.toSafeObject() }, "Buyer onboarding saved");
};

exports.onboardSupplier = async (req, res) => {
  if (req.user.role !== "supplier") return fail(res, "Only suppliers can access this", 403);

  const { businessName, businessType, contactInfo, address, operatingHours, productCategories, fabricTypes, moq } =
    req.body;
  if (!businessName || !contactInfo || !address) {
    return fail(res, "businessName, contactInfo and address are required", 400);
  }

  req.user.supplierProfile = {
    businessName,
    businessType,
    contactInfo,
    address,
    operatingHours,
    productCategories: productCategories || [],
    fabricTypes: fabricTypes || [],
    moq,
    isVerified: req.user.supplierProfile?.isVerified || false,
  };
  req.user.isOnboarded = true;
  await req.user.save();

  return ok(res, { user: req.user.toSafeObject() }, "Supplier onboarding saved");
};

exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  return ok(res, { products: user.wishlist });
};

exports.toggleWishlist = async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) return fail(res, "Product not found", 404);

  const user = req.user;
  const index = user.wishlist.findIndex((id) => String(id) === String(productId));
  let wishlisted;
  if (index === -1) {
    user.wishlist.push(productId);
    wishlisted = true;
  } else {
    user.wishlist.splice(index, 1);
    wishlisted = false;
  }
  await user.save();

  return ok(res, { wishlisted, wishlist: user.wishlist }, wishlisted ? "Added to wishlist" : "Removed from wishlist");
};

exports.updateAddress = async (req, res) => {
  const { fullName, phone, address, city, postalCode } = req.body;
  if (!fullName || !phone || !address || !city) {
    return fail(res, "fullName, phone, address and city are required", 400);
  }

  req.user.savedAddress = { fullName, phone, address, city, postalCode };
  await req.user.save();

  return ok(res, { user: req.user.toSafeObject() }, "Address saved");
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return fail(res, "currentPassword and newPassword are required", 400);
  }
  if (newPassword.length < 6) {
    return fail(res, "newPassword must be at least 6 characters", 400);
  }

  const match = await req.user.comparePassword(currentPassword);
  if (!match) return fail(res, "Current password is incorrect", 401);

  req.user.password = newPassword;
  await req.user.save();

  return ok(res, null, "Password updated");
};
