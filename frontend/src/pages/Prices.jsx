import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CaretUp, CaretDown, MagnifyingGlass, Printer, Clock } from "@phosphor-icons/react";

export default function Prices() {
  const [prices, setPrices] = useState([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("category");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/prices?only_visible=true").then((r) => {
      setPrices(r.data);
      const latest = r.data.reduce((acc, p) => (p.updated_at > (acc || "") ? p.updated_at : acc), null);
      setLastUpdated(latest);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(prices.map((p) => p.category)))], [prices]);

  const filtered = useMemo(() => {
    let list = prices.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === "price-desc") list.sort((a, b) => b.price_per_kg - a.price_per_kg);
    else if (sort === "price-asc") list.sort((a, b) => a.price_per_kg - b.price_per_kg);
    else if (sort === "change-desc") list.sort((a, b) => (b.price_per_kg - b.previous_price) - (a.price_per_kg - a.previous_price));
    else list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [prices, query, cat, sort]);

  return (
    <div className="pt-24 pb-20" data-testid="prices-page">
      <div className="section-container">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Live Market · Auto-refreshing</div>
            <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Today's Scrap Prices</h1>
            {lastUpdated && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]">
                <Clock size={14} /> Last updated {new Date(lastUpdated).toLocaleString("en-IN")}
              </div>
            )}
          </div>
          <button onClick={() => window.print()} className="btn-glass sharp text-xs" data-testid="prices-print-btn">
            <Printer size={14} weight="bold" /> Print Price List
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card sharp p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3" data-testid="prices-filters">
          <div className="flex-1 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scrap type…"
              className="w-full pl-10 pr-4 py-3 bg-[#060B14] border border-white/10 text-white sharp focus:border-[#D4AF37] outline-none text-sm"
              data-testid="prices-search-input"
            />
          </div>

          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="bg-[#060B14] border border-white/10 text-white sharp px-4 py-3 text-sm focus:border-[#D4AF37] outline-none"
            data-testid="prices-category-filter"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#060B14] border border-white/10 text-white sharp px-4 py-3 text-sm focus:border-[#D4AF37] outline-none"
            data-testid="prices-sort-select"
          >
            <option value="category">Sort: Category</option>
            <option value="price-desc">Price (High → Low)</option>
            <option value="price-asc">Price (Low → High)</option>
            <option value="change-desc">Biggest Change</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card sharp overflow-hidden" data-testid="prices-table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full price-table">
              <thead>
                <tr className="text-left">
                  {["Scrap", "Category", "Unit", "Previous", "Today", "Per Ton", "Change", "Trend"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs uppercase tracking-widest text-[#94A3B8] border-b border-white/5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#94A3B8]">No prices match your filters.</td>
                  </tr>
                )}
                {filtered.map((p) => {
                  const diff = p.price_per_kg - (p.previous_price || 0);
                  const up = diff >= 0;
                  return (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                      <td className="px-6 py-4 text-[#94A3B8] text-sm">{p.category}</td>
                      <td className="px-6 py-4 text-[#94A3B8] text-sm">{p.unit}</td>
                      <td className="px-6 py-4 text-[#94A3B8]">₹{p.previous_price?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[#D4AF37] font-semibold font-display text-lg">₹{p.price_per_kg?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-white text-sm">₹{p.price_per_ton?.toLocaleString("en-IN")}</td>
                      <td className={`px-6 py-4 font-medium ${up ? "trend-up" : "trend-down"}`}>{up ? "+" : ""}{diff.toFixed(2)}</td>
                      <td className={`px-6 py-4 ${up ? "trend-up" : "trend-down"}`}>
                        {up ? <CaretUp size={18} weight="fill" /> : <CaretDown size={18} weight="fill" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mt-6 max-w-3xl">
          Disclaimer: Prices are indicative and updated daily by our team based on prevailing market rates. Final rate depends on scrap quality, quantity, and moisture content. Call us for confirmed quotes on large lots.
        </p>
      </div>
    </div>
  );
}
