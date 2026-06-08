const DeveloperAccount = require("../Models/DeveloperAccount");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No API key provided (Bearer <secretKey>)" });
    }
    const secretKey = authHeader.split(" ")[1];

    const developer = await DeveloperAccount.findOne({ secretKey, isActive: true });
    if (!developer) {
      return res.status(401).json({ message: "Invalid or inactive API key" });
    }

    req.merchant = developer;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
