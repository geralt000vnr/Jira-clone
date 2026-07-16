const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Org-level flag, separate from per-project role
    isOrgOwner: { type: Boolean, default: false },
    avatarUrl: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Email must be globally unique, not just per-org: authController.login looks a user up
// by email alone (it runs before the caller has a token, so there's no org to scope by
// yet), and each User row belongs to exactly one organizationId. A per-org unique index
// would let the same email sign up repeatedly under different orgs, and login would then
// resolve to whichever one Mongo happens to return first.
userSchema.index({ email: 1 }, { unique: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model('User', userSchema);
