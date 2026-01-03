import React from "react";
import { Link } from "react-router-dom";

export default function HomeHero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-cyan-500/20 to-purple-600/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
          Modern Digital <span className="text-cyan-400">Banking</span>
        </h1>

        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          Experience secure, lightning-fast banking with next-generation
          technology built for the future.
        </p>

        <div className="mt-10 flex justify-center gap-6">
          <Link
            to="/starting"
            className="px-8 py-4 rounded-xl font-bold 
              bg-linear-to-r from-cyan-400 to-sky-400 
              text-slate-900 shadow-xl hover:scale-105 transition"
          >
            Open Account
          </Link>

          <Link
            to="/about"
            className="px-8 py-4 rounded-xl font-semibold 
              border border-white/30 hover:bg-white/10 transition"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
