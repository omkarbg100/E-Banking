import React from "react";

export default function Reviews() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-16">
        What Customers <span className="text-cyan-400">Say</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <p className="text-white/70">
              “The best digital banking experience I’ve ever had.”
            </p>
            <div className="mt-4 font-semibold">— Customer</div>
          </div>
        ))}
      </div>
    </div>
  );
}
