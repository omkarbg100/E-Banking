import React from "react";
import HomeNav from "../components/home/HomeNav";
import Footer from "../components/home/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <HomeNav />
      </div>

      <section className="max-w-3xl mx-auto px-6 py-32">
        <h1 className="text-5xl font-bold mb-6">
          Contact <span className="text-cyan-400">Us</span>
        </h1>

        <p className="text-white/70 mb-12">
          Have questions or need support? Reach out and we’ll get back to you.
        </p>

        <form className="space-y-6">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20
            text-white placeholder:text-white/40 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20
            text-white placeholder:text-white/40 focus:outline-none"
          />
          <textarea
            rows="5"
            placeholder="Your Message"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20
            text-white placeholder:text-white/40 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 hover:scale-[1.02] transition"
          >
            Send Message
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
