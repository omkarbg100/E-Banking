import React, { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", form);
    // TODO: connect backend auth
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-2">
        Login to <span className="text-cyan-400">E-Banking</span>
      </h2>
      <p className="text-center text-white/70 mb-6">
        Welcome back! Please enter your credentials.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Email */}
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

        {/* Password */}
        <div>
          <label className="text-sm text-white/70">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10
              text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Forgot */}
        <div className="flex justify-end text-sm">
          <Link to="#" className="text-cyan-400 hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-2 py-3 rounded-xl font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 hover:scale-[1.02] transition shadow-lg"
        >
          Login
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-white/60 mt-6">
        Don’t have an account?{" "}
        <Link to="/starting/signup" className="text-cyan-400 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
