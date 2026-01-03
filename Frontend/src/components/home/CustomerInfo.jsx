import React from "react";

export default function CustomerInfo() {
  return (
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-8">
        Trusted by <span className="text-cyan-400">Millions</span>
      </h2>

      <p className="text-white/70 max-w-3xl mx-auto">
        Our platform powers secure transactions for customers across
        the globe with enterprise-level reliability.
      </p>

      <div className="mt-16 grid grid-cols-3 gap-8">
        {[
          ["10M+", "Users"],
          ["99.99%", "Uptime"],
          ["120+", "Countries"],
        ].map(([num, label], i) => (
          <div key={i} className="text-center">
            <div className="text-4xl font-extrabold text-cyan-400">{num}</div>
            <div className="text-white/60">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
