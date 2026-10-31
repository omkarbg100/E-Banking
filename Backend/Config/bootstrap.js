const User = require("../Models/User");
const logger = require("../Infrastructure/logger");

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const existing = await User.findOne({ role: "ADMIN" });
  if (existing) return;

  await User.create({
    name: process.env.ADMIN_NAME || "Platform Admin",
    email,
    password,
    role: "ADMIN",
    isActive: true
  });

  logger.info({ email }, "seeded initial admin user");
}

module.exports = { ensureAdmin };
