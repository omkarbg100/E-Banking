import React from "react";
import HomeNav from "../components/home/HomeNav";
import Footer from "../components/home/Footer";

export default function Services() {
  const services = [
    { title: "Secure Payments", desc: "End-to-end encrypted transactions." },
    { title: "Instant Transfers", desc: "Global transfers in seconds." },
    { title: "Smart Analytics", desc: "Track spending with AI insights." },
    { title: "24/7 Support", desc: "Always-on customer assistance." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
     
        <HomeNav />
   

      <section className="max-w-7xl mx-auto px-6 py-32">
        <h1 className="text-5xl font-bold mb-6">
          Our <span className="text-cyan-400">Services</span>
        </h1>
        <p className="text-white/70 max-w-2xl mb-16">
          Powerful banking tools designed for speed, security, and simplicity.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 
              hover:-translate-y-2 transition"
            >
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
