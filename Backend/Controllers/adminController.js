const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const notifyUser = require("../Utils/notifyUser");

// ADMIN LOGIN
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "ADMIN" });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.notifyUserByAdmin = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    await notifyUser({
      userId,
      title,
      message,
      type,
    });

    res.json({ message: "Notification sent to user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

