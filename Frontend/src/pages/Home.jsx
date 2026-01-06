import React from "react";
import HomeNav from "../components/home/HomeNav";
import HomeHero from "../components/home/HomeHero";
import Services from "../components/home/Services";
import CustomerInfo from "../components/home/CustomerInfo";
import Reviews from "../components/home/Reviews";
import Footer from "../components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navbar */}
      
        <HomeNav />
    

      {/* Hero (full width feel) */}
      <section className="relative mt-16">
        <HomeHero />
      </section>

      {/* Services */}
      <section className="mt-32">
        <Services />
      </section>

      {/* Customer Info */}
      <section className="mt-32">
        <CustomerInfo />
      </section>

      {/* Reviews */}
      <section className="mt-32">
        <Reviews />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
