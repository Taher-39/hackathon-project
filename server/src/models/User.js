const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const buyerProfileSchema = new mongoose.Schema(
  {
    businessType: String,
    industry: String,
    productCategories: [String],
    fabricTypes: [String],
    typicalOrderQuantity: String,
    budgetRange: String,
  },
  { _id: false }
);

const supplierProfileSchema = new mongoose.Schema(
  {
    businessName: String,
    businessType: String,
    contactInfo: String,
    address: String,
    operatingHours: String,
    productCategories: [String],
    fabricTypes: [String],
    moq: String,
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["buyer", "supplier"], required: true },
    isOnboarded: { type: Boolean, default: false },
    buyerProfile: buyerProfileSchema,
    supplierProfile: supplierProfileSchema,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    savedAddress: addressSchema,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
