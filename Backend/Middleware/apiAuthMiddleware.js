const crypto = require("crypto");
const DeveloperAccount = require("../Models/DeveloperAccount");
const asyncHandler = require("./asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No API key provided (Bearer <secretKey>)" });
  }

  const secretKey = authHeader.slice(7).trim();
  const secretKeyHash = crypto.createHash("sha256").update(secretKey).digest("hex");

  let developer = await DeveloperAccount.findOne({ secretKeyHash, isActive: true });
  if (!developer) {
    developer = await DeveloperAccount.findOne({ secretKey, isActive: true }).select("+secretKey");
    if (developer) {
      developer.secretKeyHash = secretKeyHash;
      developer.secretKeyPreview = `${secretKey.slice(0, 12)}...${secretKey.slice(-4)}`;
      developer.secretKey = undefined;
      await developer.save({ validateModifiedOnly: true });
    }
  }

  if (!developer) {
    return res.status(401).json({ message: "Invalid or inactive API key" });
  }

  req.merchant = developer;
  return next();
});
