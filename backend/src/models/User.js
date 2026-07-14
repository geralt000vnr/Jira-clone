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

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model('User', userSchema);
