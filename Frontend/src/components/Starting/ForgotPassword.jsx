import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/auth.api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword({ email: form.email });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });

      alert("Password reset successful ✅");
      navigate("/starting/login");
    } catch (err) {
      alert(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

      <h2 className="text-2xl font-bold text-center mb-2">
        Reset <span className="text-cyan-400">Password</span>
      </h2>

      <p className="text-center text-white/70 mb-6">
        {step === 1
          ? "Enter your email to receive OTP"
          : "Enter OTP and set a new password"}
      </p>

      {/* STEP 1 */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-xl font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 shadow-lg disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-white/70">OTP</label>
            <input
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              required
              placeholder="6-digit OTP"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-xl font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 shadow-lg disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-white/60 mt-6">
        Remember your password?{" "}
        <Link
          to="/starting/login"
          className="text-cyan-400 font-medium hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
