import React, { useEffect, useState } from "react";
import { api, BACKEND_URL } from "../lib/api";
import { motion } from "framer-motion";
import { CalendarBlank, MapPin, User } from "@phosphor-icons/react";
import Seo from "../components/Seo";

export default function Projects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/projects?only_visible=true").then((r) => {
      setItems(r.data);
      setLoading(false);
    });
  }, []);

  const imgOf = (p) => {
    if (!p.image_url) return "https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg";
    return p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}/api/files/${p.image_url}`;
  };

  return (
    <div className="pt-24 pb-20" data-testid="projects-page">
      <Seo
        title="Completed Projects — NK Prestige Steel Corporation"
        description="Factory dismantling, industrial scrap, building demolition and heavy scrap projects completed across Karnataka."
        path="/projects"
      />
      <div className="section-container">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Case Studies</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Completed Projects</h1>
          <p className="text-[#94A3B8] mt-4 max-w-2xl">
            Signature projects — from factory dismantling to industrial scrap buyback — delivered on time across Karnataka.
          </p>
        </div>

        {loading && <p className="text-[#94A3B8]">Loading projects…</p>}
        {!loading && items.length === 0 && (
          <div className="glass-card sharp p-16 text-center" data-testid="projects-empty">
            <div className="text-[#94A3B8] text-sm">No projects published yet. Log in as admin to add your first project.</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
              className="glass-card sharp overflow-hidden hover-lift group"
              data-testid={`project-card-${p.id}`}
            >
              <div className="aspect-video overflow-hidden bg-[#0A1128]">
                <img src={imgOf(p)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-white text-xl mb-2">{p.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{p.description}</p>
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-[#94A3B8] border-t border-white/5 pt-4">
                  {p.customer && <span className="flex items-center gap-1.5"><User size={12} className="text-[#D4AF37]" /> {p.customer}</span>}
                  {p.location && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#D4AF37]" /> {p.location}</span>}
                  {p.completion_date && <span className="flex items-center gap-1.5"><CalendarBlank size={12} className="text-[#D4AF37]" /> {p.completion_date}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
