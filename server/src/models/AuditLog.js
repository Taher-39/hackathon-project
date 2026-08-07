const mongoose = require("mongoose");

// One entry per sensitive admin action (suspend/reactivate a user, verify/
// reject a supplier, promote someone to admin, ...). Read-only from the API
// once written — there is intentionally no update/delete route for this
// model, so it stays a trustworthy trail of what admins actually did.
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetLabel: String,
    details: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
