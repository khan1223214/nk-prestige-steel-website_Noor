import React, { useEffect, useMemo, useState } from "react";
import { api, BACKEND_URL } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, MagnifyingGlass } from "@phosphor-icons/react";

const fallbackImages = [
  "https://images.unsplash.com/photo-1770068511830-a6cc498f4bfe",
  "https://images.unsplash.com/photo-1767340078189-4258fbb7bd7c",
  "https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg",
  "https://images.pexels.com/photos/32770255/pexels-photo-32770255.jpeg",
  "https://images.pexels.com/photos/35058546/pexels-photo-35058546.jpeg",
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/gallery?only_visible=true").then((r) => setItems(r.data));
  }, []);

  const cats = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);

  const filtered = useMemo(() => {
    let list = items.filter((it) =>
      (cat === "All" || it.category === cat) &&
      ((it.title || "") + (it.caption || "")).toLowerCase().includes(query.toLowerCase())
    );
    return list;
  }, [items, cat, query]);

  // Fallback demo items when no gallery uploaded yet
  const display = filtered.length > 0
    ? filtered
    : fallbackImages.map((url, i) => ({
        id: `demo-${i}`,
        title: `Field Operation ${i + 1}`,
        caption: "Scrap yard operation",
        category: "General",
        media_type: "image",
        file_path: url,
      }));

  const srcOf = (g) => (g.file_path?.startsWith("http") ? g.file_path : `${BACKEND_URL}/api/files/${g.file_path}`);

  return (
    <div className="pt-24 pb-20" data-testid="gallery-page">
      <div className="section-container">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Field Photography · Video</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Gallery</h1>
          <p className="text-[#94A3B8] mt-4 max-w-2xl">
            A visual archive of our operations — factory dismantling, industrial pickups, warehouse loading, and completed recycling projects.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gallery…"
              className="w-full pl-10 pr-4 py-3 bg-[#060B14] border border-white/10 text-white sharp focus:border-[#D4AF37] outline-none text-sm"
              data-testid="gallery-search-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 text-xs uppercase tracking-widest sharp border transition-all whitespace-nowrap ${
                  cat === c ? "bg-[#D4AF37] text-[#060B14] border-[#D4AF37]" : "border-white/10 text-white/70 hover:border-[#D4AF37]/40"
                }`}
                data-testid={`gallery-cat-${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry via CSS columns */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]" data-testid="gallery-grid">
          {display.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 9) * 0.03 }}
              className="gallery-tile sharp mb-4 break-inside-avoid cursor-pointer group glass-card"
              onClick={() => setSelected(g)}
              data-testid={`gallery-item-${g.id}`}
            >
              {g.media_type === "video" ? (
                <video src={srcOf(g)} muted className="w-full block" />
              ) : (
                <img src={srcOf(g)} alt={g.title} loading="lazy" className="w-full block" />
              )}
              <div className="absolute bottom-3 left-4 right-4 z-10">
                <div className="text-white text-sm font-medium">{g.title}</div>
                <div className="text-[#D4AF37] text-[10px] uppercase tracking-widest">{g.category}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060B14]/95 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
            data-testid="gallery-lightbox"
          >
            <button
              className="absolute top-6 right-6 text-white p-2 hover:text-[#D4AF37]"
              onClick={() => setSelected(null)}
              data-testid="lightbox-close"
            >
              <X size={28} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selected.media_type === "video" ? (
                <video src={srcOf(selected)} controls autoPlay className="max-h-[85vh] w-full sharp" />
              ) : (
                <img src={srcOf(selected)} alt={selected.title} className="max-h-[85vh] w-auto sharp" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
