const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isActive: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date },
    phone: { type: String },
    phoneVerifiedAt: { type: Date },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    emailVerifiedAt: this.emailVerifiedAt,
    mfaEnabled: this.mfaEnabled
  };
};

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String },
    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const auditSchema = new mongoose.Schema(
  {
    actorId: { type: String },
    action: { type: String, required: true },
    target: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    result: { type: String, enum: ["SUCCESS", "FAILURE"], default: "SUCCESS" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
const AuditLog = mongoose.model("AuditLog", auditSchema);

module.exports = { User, RefreshToken, AuditLog };
