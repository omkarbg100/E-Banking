import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

export default function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50">
      <div
        className="flex items-center justify-between px-6 py-4 rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="w-11 h-11 rounded-lg" />
          <div className="hidden sm:block">
            <h3 className="text-lg font-bold">E-Banking</h3>
            <p className="text-xs text-white/70">Secure · Smart · Reliable</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8">
          {["/", "/services", "/about", "/contact"].map((path) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? "text-cyan-400" : "text-white/70 hover:text-white"
                }`
              }
            >
              {path === "/" ? "Home" : path.replace("/", "")}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex gap-4">
          <Link
            to="/starting"
            className="px-5 py-2 rounded-lg font-bold 
              bg-linear-to-r from-cyan-400 to-sky-400 
              text-slate-900 hover:scale-105 transition shadow-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden rounded-2xl bg-slate-900 border border-white/20 overflow-hidden
  transition-[max-height,opacity,margin] duration-300
  ${open ? "mt-3 opacity-100 max-h-125" : "mt-0 opacity-0 max-h-0 pointer-events-none"}
  `}
      >
        <div className="flex flex-col p-6 gap-4">
          {["/", "/services", "/about", "/contact"].map((path) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white transition"
            >
              {path === "/" ? "Home" : path.replace("/", "")}
            </Link>
          ))}

          {/* Divider */}
          <div className="h-px bg-white/10 my-3" />

          {/* CTA */}
          <Link
            to="/starting"
            onClick={() => setOpen(false)}
            className="w-full text-center px-5 py-3 rounded-lg font-bold
        bg-linear-to-r from-cyan-400 to-sky-400
        text-slate-900 shadow-lg hover:scale-[1.02] transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
