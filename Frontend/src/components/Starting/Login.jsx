import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const { setUser, loading, setLoading } = useAuth(); // ✅ CONTEXT
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
      const res = await login(form);

      // ✅ Store token
      localStorage.setItem("token", res.data.token);

      // ✅ Update global auth state
      setUser(res.data.user);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-center mb-2">
        Login to <span className="text-cyan-400">E-Banking</span>
      </h2>
      <p className="text-center text-white/70 mb-6">
        Welcome back! Please enter your credentials.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
            text-white focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div>
          <label className="text-sm text-white/70">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
            text-white focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="flex justify-end text-sm">
          <Link
            to="/starting/forgot-password"
            className="text-cyan-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-3 rounded-xl font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 shadow-lg hover:scale-[1.02]
            disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center text-sm text-white/60 mt-6">
        Don’t have an account?{" "}
        <Link
          to="/starting/signup"
          className="text-cyan-400 font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;

