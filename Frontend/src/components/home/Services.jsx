import React from "react";

const services = [
  { title: "Secure Payments", desc: "Military-grade encryption for every transaction." },
  { title: "Instant Transfers", desc: "Send money globally in seconds." },
  { title: "Smart Analytics", desc: "Track and manage finances effortlessly." },
];

export default function Services() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-16">
        Our <span className="text-cyan-400">Services</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {services.map((s, i) => (
          <div
            key={i}
            className="p-8 rounded-2xl bg-white/5 border border-white/10 
              hover:-translate-y-2 hover:shadow-2xl transition"
          >
            <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
            <p className="text-white/70">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
