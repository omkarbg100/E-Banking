import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export default function AdminLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BASE_URL}/user/login`, form);

      const { token, user } = res.data;

      // ❌ Block non-admin users
      if (user.role !== "ADMIN") {
        throw new Error("Access denied: Admin only");
      }

      // ✅ Store admin auth
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Admin login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-white">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2 text-cyan-400">
          Admin Login
        </h2>
        <p className="text-center text-white/60 mb-6">
          Authorized access only
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-sm text-white/70">Admin Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-xl font-semibold
              bg-linear-to-r from-cyan-400 to-sky-400
              text-slate-900 transition shadow-lg
              hover:scale-[1.02]
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
