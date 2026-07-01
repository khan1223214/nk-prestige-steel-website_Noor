import React, { useEffect, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, WhatsappLogo, CurrencyInr, Images, Truck, MapPin, ArrowRight, Sparkle, ShieldCheck, Handshake, Recycle, Star } from "@phosphor-icons/react";
import { api } from "../lib/api";
import Counter from "../components/Counter";
import PriceTicker from "../components/PriceTicker";

const Hero3D = lazy(() => import("../components/Hero3D"));

const stats = [
  { label: "Tonnes Recycled", value: 12500, suffix: "+" },
  { label: "Happy Clients", value: 850, suffix: "+" },
  { label: "Years Experience", value: 15, suffix: "+" },
  { label: "Pickup Locations", value: 40, suffix: "+" },
];

export default function Home({ info }) {
  const [prices, setPrices] = useState([]);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    api.get("/prices?only_visible=true").then((r) => setPrices(r.data));
    api.get("/services?only_visible=true").then((r) => setServices(r.data));
    api.get("/testimonials?only_visible=true").then((r) => setTestimonials(r.data));
    api.get("/faqs?only_visible=true").then((r) => setFaqs(r.data));
    api.get("/gallery?only_visible=true").then((r) => setGallery(r.data));
  }, []);

  const phone = (info?.phone || "").replace(/\s|\+/g, "");
  const wa = (info?.whatsapp || "").replace(/\s|\+/g, "");

  return (
    <div className="pt-16">
      {/* ================= HERO ================= */}
      <section className="relative min-h-[92vh] overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 industrial-grid opacity-40" />
        <div className="noise-overlay" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#0A1128] blur-[100px]" />
        </div>

        <div className="section-container grid lg:grid-cols-2 gap-8 items-center min-h-[92vh] relative pt-8 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 mb-8">
              <Sparkle className="text-[#D4AF37]" size={14} weight="fill" />
              <span className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">GST Certified · Est. Karnataka</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tighter" data-testid="hero-title">
              India's Trusted <br />
              <span className="text-gold-gradient">Scrap Recycling</span> Partner
            </h1>

            <p className="mt-6 text-lg text-[#94A3B8] max-w-xl leading-relaxed" data-testid="hero-subtitle">
              {info?.subtitle || "We Buy All Types of Scrap at the Best Market Price"}. Instant quotes, doorstep pickup, and same-day payment.
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <a href={`tel:${info?.phone}`} className="btn-primary sharp" data-testid="hero-btn-call">
                <Phone size={16} weight="bold" /> Call Owner
              </a>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-glass sharp" data-testid="hero-btn-whatsapp">
                <WhatsappLogo size={16} weight="bold" /> WhatsApp
              </a>
              <Link to="/pickup" className="btn-secondary sharp" data-testid="hero-btn-quote">
                Get Quote <ArrowRight size={14} weight="bold" />
              </Link>
              <Link to="/prices" className="btn-glass sharp" data-testid="hero-btn-prices">
                <CurrencyInr size={16} weight="bold" /> Today's Prices
              </Link>
              <Link to="/gallery" className="btn-glass sharp" data-testid="hero-btn-gallery">
                <Images size={16} weight="bold" /> Gallery
              </Link>
              <Link to="/pickup" className="btn-glass sharp" data-testid="hero-btn-pickup">
                <Truck size={16} weight="bold" /> Request Pickup
              </Link>
              <a href={info?.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-glass sharp" data-testid="hero-btn-directions">
                <MapPin size={16} weight="bold" /> Directions
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14" data-testid="hero-stats">
              {stats.map((s) => (
                <div key={s.label} className="border-l border-[#D4AF37]/30 pl-4">
                  <div className="stat-number text-3xl sm:text-4xl font-semibold">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3D scene */}
          <div className="relative h-[420px] sm:h-[520px] lg:h-[640px]">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[#94A3B8]">Loading 3D…</div>}>
              <Hero3D />
            </Suspense>
            {/* Bottom highlight */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.32em] text-[#94A3B8]">
              Interactive · Ferrous · Non-Ferrous · E-Waste
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <PriceTicker prices={prices} />

      {/* ================= TRUST STRIP ================= */}
      <section className="section-container py-16" data-testid="trust-strip">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck size={28} weight="duotone" />, title: "Transparent Pricing", desc: "Daily market rates published live. Zero hidden charges." },
            { icon: <Handshake size={28} weight="duotone" />, title: "Instant Payment", desc: "NEFT / RTGS / UPI or cash on the spot after weighing." },
            { icon: <Recycle size={28} weight="duotone" />, title: "Certified Recycling", desc: "GST compliant scrap dealer for factories and dismantling." },
          ].map((c) => (
            <div key={c.title} className="glass-card p-8 sharp hover-lift" data-testid={`trust-card-${c.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="text-[#D4AF37] mb-4">{c.icon}</div>
              <h3 className="font-display text-xl text-white mb-2">{c.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= LIVE PRICES PREVIEW ================= */}
      <section className="section-container py-20" data-testid="prices-preview-section">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Live Market</div>
            <h2 className="font-display text-3xl sm:text-4xl text-white">Today's Scrap Prices</h2>
          </div>
          <Link to="/prices" className="text-[#D4AF37] text-sm uppercase tracking-widest hover:text-[#F0C420] flex items-center gap-2" data-testid="prices-view-all">
            View Full Price List <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass-card sharp overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full price-table">
              <thead>
                <tr className="text-left">
                  {["Scrap", "Category", "Previous", "Today", "Change", "Trend"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs uppercase tracking-widest text-[#94A3B8] border-b border-white/5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prices.slice(0, 8).map((p) => {
                  const diff = p.price_per_kg - (p.previous_price || 0);
                  const up = diff >= 0;
                  return (
                    <tr key={p.id} className="border-b border-white/5" data-testid={`price-row-${p.id}`}>
                      <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                      <td className="px-6 py-4 text-[#94A3B8] text-sm">{p.category}</td>
                      <td className="px-6 py-4 text-[#94A3B8]">₹{p.previous_price?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[#D4AF37] font-semibold font-display">₹{p.price_per_kg?.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-medium ${up ? "trend-up" : "trend-down"}`}>{up ? "+" : ""}{diff.toFixed(2)}</td>
                      <td className={`px-6 py-4 ${up ? "trend-up" : "trend-down"}`}>{up ? "▲" : "▼"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="section-container py-20" data-testid="services-section">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">What We Buy</div>
            <h2 className="font-display text-3xl sm:text-4xl text-white">Complete Scrap Services</h2>
          </div>
          <Link to="/services" className="text-[#D4AF37] text-sm uppercase tracking-widest hover:text-[#F0C420] flex items-center gap-2" data-testid="services-view-all">
            All Services <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.slice(0, 12).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="glass-card sharp p-6 hover-lift group cursor-pointer"
              data-testid={`service-card-${s.id}`}
            >
              <div className="w-11 h-11 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 sharp mb-4 group-hover:bg-[#D4AF37] group-hover:text-[#060B14] transition-all">
                <Recycle size={20} weight="duotone" className="text-[#D4AF37] group-hover:text-[#060B14]" />
              </div>
              <h3 className="font-display text-white text-base leading-tight mb-1">{s.title}</h3>
              <p className="text-[#94A3B8] text-xs leading-relaxed line-clamp-2">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= GALLERY PREVIEW ================= */}
      <section className="section-container py-20" data-testid="gallery-preview-section">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Field Operations</div>
            <h2 className="font-display text-3xl sm:text-4xl text-white">Our Work in Action</h2>
          </div>
          <Link to="/gallery" className="text-[#D4AF37] text-sm uppercase tracking-widest hover:text-[#F0C420] flex items-center gap-2" data-testid="gallery-view-all">
            Full Gallery <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(gallery.length > 0 ? gallery : [
            { id: "d1", file_path: "https://images.unsplash.com/photo-1770068511830-a6cc498f4bfe" },
            { id: "d2", file_path: "https://images.unsplash.com/photo-1767340078189-4258fbb7bd7c" },
            { id: "d3", file_path: "https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg" },
            { id: "d4", file_path: "https://images.pexels.com/photos/32770255/pexels-photo-32770255.jpeg" },
          ]).slice(0, 8).map((g) => {
            const src = g.file_path?.startsWith("http") ? g.file_path : `${process.env.REACT_APP_BACKEND_URL}/api/files/${g.file_path}`;
            return (
              <div key={g.id} className="gallery-tile sharp aspect-square glass-card overflow-hidden" data-testid={`gallery-preview-${g.id}`}>
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section-container py-20" data-testid="testimonials-section">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Trusted by 850+ Clients</div>
          <h2 className="font-display text-3xl sm:text-4xl text-white">What Our Clients Say</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="glass-card sharp p-6 hover-lift flex flex-col" data-testid={`testimonial-${t.id}`}>
              <div className="flex text-[#D4AF37] mb-4">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} size={14} weight="fill" />
                ))}
              </div>
              <p className="text-[#e2e8f0] text-sm leading-relaxed mb-6 flex-1">"{t.message}"</p>
              <div>
                <div className="font-display text-white text-sm">{t.name}</div>
                <div className="text-xs text-[#94A3B8]">{t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="section-container py-20" data-testid="faq-section">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Quick Answers</div>
            <h2 className="font-display text-3xl sm:text-4xl text-white">Frequently Asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={f.id} className="glass-card sharp p-5 group" data-testid={`faq-${f.id}`}>
                <summary className="cursor-pointer flex items-center justify-between gap-4 text-white font-display list-none">
                  <span>{f.question}</span>
                  <span className="text-[#D4AF37] group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="text-[#94A3B8] mt-3 text-sm leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section-container py-20" data-testid="home-cta-section">
        <div className="glass-card sharp p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#D4AF37]/20 blur-[80px]" />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight">Have scrap to sell?</h2>
              <p className="text-[#94A3B8] mt-3">Get an instant quote or schedule a free pickup today.</p>
            </div>
            <div className="flex gap-3">
              <a href={`tel:${info?.phone}`} className="btn-primary sharp" data-testid="cta-call">
                <Phone size={16} weight="bold" /> Call Now
              </a>
              <Link to="/pickup" className="btn-secondary sharp" data-testid="cta-pickup">
                Request Pickup <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
