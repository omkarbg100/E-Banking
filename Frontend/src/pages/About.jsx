import React from "react";
import HomeNav from "../components/home/HomeNav";
import Footer from "../components/home/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <HomeNav />
      </div>

      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <h1 className="text-5xl font-bold mb-6">
          About <span className="text-cyan-400">E-Banking</span>
        </h1>

        <p className="text-white/70 leading-relaxed">
          E-Banking is a next-generation digital banking platform built with
          enterprise-grade security and modern technology.  
          Our mission is to simplify finance while keeping your money safe.
        </p>

        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            ["10M+", "Users"],
            ["99.99%", "Uptime"],
            ["120+", "Countries"],
          ].map(([num, label], i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-cyan-400">{num}</div>
              <div className="text-white/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
