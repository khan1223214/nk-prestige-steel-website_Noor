import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CaretUp, CaretDown, MagnifyingGlass, Printer, Clock, BellRinging, WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import Seo from "../components/Seo";

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
      <Seo title="Today's Live Scrap Prices — NK Prestige Steel Corporation" description="Daily updated scrap rates for iron, copper, brass, aluminium, stainless steel, batteries, electronics, and more. Search, filter, and check trends." path="/prices" />
      <div className="section-container">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Live Market · Auto-refreshing</div>
            <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Today&apos;s Scrap Prices</h1>
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

        <PriceAlertOptIn categories={categories.filter((c) => c !== "All")} />
      </div>
    </div>
  );
}

function PriceAlertOptIn({ categories }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleMetal = (m) => {
    setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const submit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/price-alerts", { name: name.trim(), phone: digits, metals: selected });
      toast.success("You're subscribed! We'll WhatsApp you when prices move.");
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-12 glass-card sharp p-8 text-center" data-testid="price-alert-success">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] mb-4">
          <WhatsappLogo size={28} weight="fill" />
        </div>
        <h3 className="font-display text-2xl text-white mb-2">You&apos;re on the list</h3>
        <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
          Our team will reach out on WhatsApp with today&apos;s rates and notify you when your selected metals see a big move.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-14 glass-card sharp p-8 lg:p-10" data-testid="price-alert-form">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">
            <BellRinging size={14} weight="fill" /> Free WhatsApp Alerts
          </div>
          <h3 className="font-display text-3xl text-white leading-tight mb-3">
            Never miss a price spike again
          </h3>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Get a WhatsApp ping the moment copper, aluminium, brass or your chosen metals move sharply. No spam — only when it matters. You can opt out any time.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-4 py-3 bg-[#060B14] border border-white/10 text-white sharp focus:border-[#D4AF37] outline-none text-sm"
              data-testid="price-alert-name-input"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp number (10 digits)"
              className="w-full px-4 py-3 bg-[#060B14] border border-white/10 text-white sharp focus:border-[#D4AF37] outline-none text-sm"
              data-testid="price-alert-phone-input"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Alert me on (optional)</div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = selected.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleMetal(c)}
                      className={`px-3 py-1.5 sharp text-xs border transition ${active ? "bg-[#D4AF37] text-[#0B0F1A] border-[#D4AF37] font-semibold" : "border-white/15 text-[#CBD5E1] hover:border-[#D4AF37]/60"}`}
                      data-testid={`price-alert-metal-${c.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B0F1A] font-semibold sharp hover:bg-[#e6c34a] transition disabled:opacity-50"
            data-testid="price-alert-submit-btn"
          >
            <WhatsappLogo size={18} weight="fill" />
            {submitting ? "Subscribing…" : "Get WhatsApp Alerts"}
          </button>

          <p className="text-[10px] uppercase tracking-widest text-[#64748B]">
            We respect your privacy. No spam, unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
