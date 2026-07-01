import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { motion } from "framer-motion";
import { MagnifyingGlass, Recycle } from "@phosphor-icons/react";
import * as Icons from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function Services() {
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/services?only_visible=true").then((r) => setServices(r.data));
  }, []);

  const filtered = useMemo(
    () =>
      services.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())
      ),
    [services, query]
  );

  const IconFor = (name) => {
    const C = Icons[name] || Recycle;
    return <C size={22} weight="duotone" />;
  };

  return (
    <div className="pt-24 pb-20" data-testid="services-page">
      <Seo title="Scrap Services — NK Prestige Steel Corporation" description="Complete scrap dealer and demolition services in Karnataka. MS, TMT, copper, brass, aluminium, e-waste, factory demolition, and more." path="/services" />
      <div className="section-container">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">What We Buy · What We Do</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Our Complete Services</h1>
          <p className="text-[#94A3B8] mt-4 max-w-2xl">
            From single-item scrap to complete factory dismantling — we handle it all with GST invoicing, safety compliance, and instant payment.
          </p>
        </div>

        <div className="relative mb-8 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-10 pr-4 py-3 bg-[#060B14] border border-white/10 text-white sharp focus:border-[#D4AF37] outline-none text-sm"
            data-testid="services-search-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="services-grid">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 12) * 0.03 }}
              className="glass-card sharp p-6 hover-lift group cursor-pointer"
              data-testid={`services-page-card-${s.id}`}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 sharp mb-5 group-hover:bg-[#D4AF37] group-hover:text-[#060B14] transition-all text-[#D4AF37]">
                {IconFor(s.icon)}
              </div>
              <h3 className="font-display text-white text-lg leading-tight mb-2">{s.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{s.description}</p>
              <Link to="/pickup" className="mt-4 inline-block text-[#D4AF37] text-xs uppercase tracking-widest hover:text-[#F0C420]">
                Get quote →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
