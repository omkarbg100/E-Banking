import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emailOTP, verifyOTP, register } from "../../api/auth.api";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    otp: "",
    name: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // STEP 1: Send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await emailOTP({ email: form.email });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP + Register
  const registerUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const verifyRes = await verifyOTP({
        email: form.email,
        otp: form.otp,
      });

      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        verificationToken: verifyRes.data.verificationToken,
      });

      alert("Account created successfully 🎉");
      navigate("/starting/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-2">
        Create your <span className="text-cyan-400">E-Banking</span> account
      </h2>
      <p className="text-center text-white/70 mb-6">
        Secure onboarding with email verification
      </p>

      {/* STEP 1: EMAIL */}
      {step === 1 && (
        <form onSubmit={sendOtp} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-white/70">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
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
            text-slate-900 hover:scale-[1.02] transition shadow-lg disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* STEP 2: OTP + DETAILS */}
      {step === 2 && (
        <form onSubmit={registerUser} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-white/70">OTP</label>
            <input
              type="text"
              name="otp"
              required
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
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
            text-slate-900 hover:scale-[1.02] transition shadow-lg disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}

      {/* Footer */}
      <p className="text-center text-sm text-white/60 mt-6">
        Already have an account?{" "}
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

export default Signup;
