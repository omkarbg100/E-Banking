import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-white/10 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white">E-Banking</h3>
            <p className="mt-4 text-white/60 max-w-md">
              A modern digital banking platform built with enterprise-grade
              security, lightning-fast transactions, and global accessibility.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-white">
                Subscribe to our newsletter
              </p>
              <div className="mt-3 flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-l-lg bg-white/10 border border-white/20 
                  text-white placeholder:text-white/40 focus:outline-none"
                />
                <button className="px-5 py-3 rounded-r-lg font-semibold 
                  bg-linear-to-r from-cyan-400 to-sky-400 text-slate-900">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-white/60">
              <li><Link to="/features" className="hover:text-white">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/security" className="hover:text-white">Security</Link></li>
              <li><Link to="/integrations" className="hover:text-white">Integrations</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-white/60">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-white/60">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              <li><Link to="/compliance" className="hover:text-white">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row 
          items-center justify-between gap-6">

          {/* Copyright */}
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} E-Banking. All rights reserved.
          </p>

          {/* Socials */}
          <div className="flex gap-4">
            {[
              { name: "Twitter", icon: "𝕏", link: "#" },
              { name: "LinkedIn", icon: "in", link: "#" },
              { name: "GitHub", icon: "GH", link: "#" },
            ].map((s, i) => (
              <a
                key={i}
                href={s.link}
                className="w-10 h-10 flex items-center justify-center rounded-full 
                  bg-white/10 hover:bg-white/20 transition text-white"
                aria-label={s.name}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
