/**
 * A website account.
 *
 * The scanner never stores or sends a password after login — it keeps only the
 * tokens the server issued. That means this is the single place a password is
 * ever hashed or verified.
 *
 * Hashing lives in a pre-save hook so a future code path cannot accidentally
 * persist a plaintext password by forgetting to call a helper.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_USER, ROLE_GUEST } = require('../utils/tokens');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      // Never selected by default: an accidental `res.json(user)` cannot leak it.
      select: false,
    },
    displayName: { type: String, default: '', trim: true },
    role: {
      type: String,
      enum: [ROLE_USER, ROLE_GUEST],
      default: ROLE_USER,
    },
    organization: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** Hash the password whenever it changes. */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  // Already-hashed values are 60 chars and start with the bcrypt marker.
  if (typeof this.passwordHash === 'string' && /^\$2[aby]\$/.test(this.passwordHash)) {
    return next();
  }
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
    return next();
  } catch (error) {
    return next(error);
  }
});

/** Constant-time comparison. Returns false rather than throwing. */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!candidate || !this.passwordHash) return false;
  try {
    return await bcrypt.compare(candidate, this.passwordHash);
  } catch {
    return false;
  }
};

/** The account as the API may return it. */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: String(this._id),
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    organization: this.organization,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

/** Lower-case an address so "A@x.com" and "a@x.com" cannot both register. */
userSchema.statics.normaliseEmail = function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase();
};

module.exports = mongoose.model('User', userSchema);
