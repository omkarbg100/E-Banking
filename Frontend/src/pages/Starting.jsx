import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const Starting = () => {
  const location = useLocation();

  // If user is already on login/signup, render outlet only
  if (location.pathname !== "/starting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Welcome to <span className="text-cyan-400">E-Banking</span>
        </h1>
        <p className="text-center text-white/70 mb-8">
          Secure. Smart. Reliable banking experience.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <Link
            to="/starting/login"
            className="w-full text-center py-3 rounded-xl font-semibold
              bg-linear-to-r from-cyan-400 to-sky-400
              text-slate-900 hover:scale-[1.02] transition shadow-lg"
          >
            Login
          </Link>

          <Link
            to="/starting/signup"
            className="w-full text-center py-3 rounded-xl font-semibold
              border border-white/20 text-white hover:bg-white/10 transition"
          >
            Create an Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/60 mt-6">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer">Terms</span> &{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Starting;
