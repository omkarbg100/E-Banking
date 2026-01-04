const User = require("../Models/User");
const Account = require("../Models/Account");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../Utils/sendEmail");

// ================= REGISTER =================

const Otp = require("../Models/Otp");

const sendRegisterOtp = async (req, res) => {
  const { email } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email },
    {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    },
    { upsert: true }
  );

  await sendEmail(email, `Your registration OTP is ${otp}`);

  res.json({ message: "OTP sent to email" });
};


const  verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });

  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  res.json({ message: "OTP verified successfully" });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    return res.status(400).json({ message: "OTP verification required" });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  await Otp.deleteOne({ email });

  res.status(201).json({ message: "User registered successfully" });
};



// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("Comparing password:", password, "with stored hash:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (password !== user.password ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail(
      user.email,
      "Password Reset OTP",
      `Your OTP is ${otp}. It is valid for 10 minutes.`
    );

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      otp,
      otpExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password while logged in
const resetPasswordLoggedIn = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendRegisterOtp,
    verifyRegisterOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordLoggedIn,
};
// ================= EXPORTS =================
