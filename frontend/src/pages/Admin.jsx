import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api, BACKEND_URL } from "../lib/api";
import { toast } from "sonner";
import {
  SignOut, CurrencyInr, Wrench, Images, ChatCircleDots, Question, Buildings, Truck,
  PencilSimple, Trash, Plus, UploadSimple, DownloadSimple, X, Check, ArrowSquareOut,
} from "@phosphor-icons/react";

const TABS = [
  { key: "info", label: "Business Info", icon: <Buildings size={16} /> },
  { key: "prices", label: "Scrap Prices", icon: <CurrencyInr size={16} /> },
  { key: "services", label: "Services", icon: <Wrench size={16} /> },
  { key: "gallery", label: "Gallery", icon: <Images size={16} /> },
  { key: "testimonials", label: "Testimonials", icon: <ChatCircleDots size={16} /> },
  { key: "faqs", label: "FAQ", icon: <Question size={16} /> },
  { key: "pickups", label: "Pickup Requests", icon: <Truck size={16} /> },
];

export default function Admin() {
  const { admin, checking, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("info");

  useEffect(() => {
    if (!checking && !admin) nav("/login");
  }, [admin, checking, nav]);

  if (checking) return <div className="min-h-screen flex items-center justify-center text-[#94A3B8]">Loading…</div>;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex bg-[#050912]" data-testid="admin-page">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#060B14] flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8a6f18] sharp">
              <span className="font-display font-bold text-[#060B14] text-lg">NK</span>
            </div>
            <div>
              <div className="font-display text-white text-sm">NK Prestige</div>
              <div className="text-[10px] tracking-widest uppercase text-[#94A3B8]">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                tab === t.key
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              data-testid={`admin-tab-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#94A3B8] hover:text-[#D4AF37] flex items-center gap-2 mb-3">
            <ArrowSquareOut size={12} /> View Public Site
          </a>
          <button onClick={() => { logout(); nav("/"); }} className="text-xs text-white flex items-center gap-2" data-testid="admin-logout-btn">
            <SignOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {/* Mobile top nav */}
        <div className="lg:hidden border-b border-white/5 p-4 flex gap-2 overflow-x-auto bg-[#0A1128]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-xs uppercase tracking-widest whitespace-nowrap sharp border ${
                tab === t.key ? "bg-[#D4AF37] text-[#060B14] border-[#D4AF37]" : "border-white/10 text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button onClick={() => { logout(); nav("/"); }} className="text-white ml-auto whitespace-nowrap text-xs">Sign out</button>
        </div>

        <div className="p-6 lg:p-10">
          {tab === "info" && <BusinessInfoTab />}
          {tab === "prices" && <PricesTab />}
          {tab === "services" && <ServicesTab />}
          {tab === "gallery" && <GalleryTab />}
          {tab === "testimonials" && <TestimonialsTab />}
          {tab === "faqs" && <FaqsTab />}
          {tab === "pickups" && <PickupsTab />}
        </div>
      </main>
    </div>
  );
}

// -------------------- Business Info --------------------
function BusinessInfoTab() {
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("/business-info").then((r) => setInfo(r.data));
  }, []);
  if (!info) return <p className="text-[#94A3B8]">Loading…</p>;

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/business-info", info);
      toast.success("Business info updated");
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const fields = [
    ["business_name", "Business Name"], ["tagline", "Tagline"], ["subtitle", "Hero Subtitle"],
    ["phone", "Phone"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["gst_number", "GST Number"],
    ["office_address", "Office Address"], ["godown_address", "Godown Address"],
    ["google_maps_url", "Google Maps URL"], ["working_hours", "Working Hours"],
    ["facebook", "Facebook URL"], ["instagram", "Instagram URL"], ["linkedin", "LinkedIn URL"],
    ["twitter", "Twitter URL"], ["youtube", "YouTube URL"],
  ];

  return (
    <div>
      <SectionHeader title="Business Information" subtitle="These details appear across the site — contact bar, footer, contact page." />
      <div className="glass-card sharp p-6 grid md:grid-cols-2 gap-4">
        {fields.map(([k, label]) => (
          <label key={k} className="block">
            <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">{label}</span>
            {k.includes("address") ? (
              <textarea
                value={info[k] || ""}
                onChange={(e) => setInfo({ ...info, [k]: e.target.value })}
                rows={2}
                className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm resize-none"
                data-testid={`info-${k}`}
              />
            ) : (
              <input
                value={info[k] || ""}
                onChange={(e) => setInfo({ ...info, [k]: e.target.value })}
                className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm"
                data-testid={`info-${k}`}
              />
            )}
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-primary sharp mt-6" data-testid="info-save-btn">
        <Check size={14} weight="bold" /> {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// -------------------- Prices --------------------
function PricesTab() {
  const [prices, setPrices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const blank = { category: "Ferrous", name: "", unit: "kg", price_per_kg: 0, previous_price: 0, notes: "", visible: true };

  const load = () => api.get("/prices").then((r) => setPrices(r.data));
  useEffect(() => { load(); }, []);

  const save = async (row) => {
    setBusy(true);
    try {
      const payload = {
        category: row.category, name: row.name, unit: row.unit || "kg",
        price_per_kg: Number(row.price_per_kg), previous_price: Number(row.previous_price || row.price_per_kg),
        notes: row.notes || "", visible: !!row.visible,
      };
      if (row.id) await api.put(`/prices/${row.id}`, payload);
      else await api.post("/prices", payload);
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error("Save failed");
    }
    setBusy(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this price?")) return;
    await api.delete(`/prices/${id}`);
    toast.success("Deleted");
    load();
  };

  const exportCsv = async () => {
    try {
      const res = await api.get("/prices/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scrap_prices.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/prices/import/csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported ${data.imported} rows`);
      load();
    } catch { toast.error("Import failed"); }
    e.target.value = "";
  };

  return (
    <div>
      <SectionHeader title="Live Scrap Prices" subtitle="Update daily rates. Previous price auto-tracks changes." action={
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setEditing({ ...blank })} className="btn-primary sharp text-xs" data-testid="price-add-btn">
            <Plus size={14} weight="bold" /> Add Price
          </button>
          <button onClick={exportCsv} className="btn-glass sharp text-xs" data-testid="price-export-btn">
            <DownloadSimple size={14} /> Export CSV
          </button>
          <label className="btn-glass sharp text-xs cursor-pointer">
            <UploadSimple size={14} /> Import CSV
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importCsv} data-testid="price-import-input" />
          </label>
        </div>
      }/>

      {editing && (
        <div className="glass-card sharp p-6 mb-6" data-testid="price-editor">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Category">
              <input className="input-a" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            </Field>
            <Field label="Name">
              <input className="input-a" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Unit">
              <input className="input-a" value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </Field>
            <Field label="Today's Price (₹/kg)">
              <input type="number" step="0.01" className="input-a" value={editing.price_per_kg} onChange={(e) => setEditing({ ...editing, price_per_kg: e.target.value })} />
            </Field>
            <Field label="Previous Price (₹/kg)">
              <input type="number" step="0.01" className="input-a" value={editing.previous_price || 0} onChange={(e) => setEditing({ ...editing, previous_price: e.target.value })} />
            </Field>
            <Field label="Visible">
              <select className="input-a" value={editing.visible ? "1" : "0"} onChange={(e) => setEditing({ ...editing, visible: e.target.value === "1" })}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => save(editing)} disabled={busy} className="btn-primary sharp text-xs">Save</button>
            <button onClick={() => setEditing(null)} className="btn-glass sharp text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card sharp overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                {["Category", "Name", "Unit", "Today", "Previous", "Visible", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#94A3B8] border-b border-white/5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{p.category}</td>
                  <td className="px-4 py-3 text-white text-sm">{p.name}</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{p.unit}</td>
                  <td className="px-4 py-3 text-[#D4AF37] text-sm font-medium">₹{p.price_per_kg}</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">₹{p.previous_price}</td>
                  <td className="px-4 py-3 text-sm">{p.visible ? "✓" : "✗"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => setEditing({ ...p })} className="text-[#D4AF37] hover:text-[#F0C420]" data-testid={`price-edit-${p.id}`}><PencilSimple size={16} /></button>
                    <button onClick={() => remove(p.id)} className="text-[#EF4444]" data-testid={`price-del-${p.id}`}><Trash size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <InputAStyles />
    </div>
  );
}

// -------------------- Services --------------------
function ServicesTab() {
  return (
    <CrudSection
      title="Services"
      subtitle="Add or edit scrap categories shown on the site."
      endpoint="/services"
      fields={[
        { key: "title", label: "Title" },
        { key: "description", label: "Description", textarea: true },
        { key: "icon", label: "Icon name (Phosphor)" },
        { key: "image_url", label: "Image URL (optional)" },
        { key: "order", label: "Order", type: "number" },
        { key: "visible", label: "Visible", type: "boolean" },
      ]}
      display={(s) => ({ primary: s.title, secondary: s.description, meta: s.icon })}
      blank={{ title: "", description: "", icon: "Wrench", image_url: "", order: 0, visible: true }}
      testidPrefix="service"
    />
  );
}

// -------------------- Testimonials --------------------
function TestimonialsTab() {
  return (
    <CrudSection
      title="Testimonials"
      subtitle="Customer reviews shown on the home page."
      endpoint="/testimonials"
      fields={[
        { key: "name", label: "Name" },
        { key: "location", label: "Location" },
        { key: "rating", label: "Rating (1-5)", type: "number" },
        { key: "message", label: "Message", textarea: true },
        { key: "avatar_url", label: "Avatar URL (optional)" },
        { key: "visible", label: "Visible", type: "boolean" },
      ]}
      display={(t) => ({ primary: `${t.name} — ★${t.rating}`, secondary: t.message, meta: t.location })}
      blank={{ name: "", location: "", rating: 5, message: "", avatar_url: "", visible: true }}
      testidPrefix="testimonial"
    />
  );
}

// -------------------- FAQ --------------------
function FaqsTab() {
  return (
    <CrudSection
      title="FAQ"
      subtitle="Common questions and answers."
      endpoint="/faqs"
      fields={[
        { key: "question", label: "Question" },
        { key: "answer", label: "Answer", textarea: true },
        { key: "order", label: "Order", type: "number" },
        { key: "visible", label: "Visible", type: "boolean" },
      ]}
      display={(f) => ({ primary: f.question, secondary: f.answer, meta: `Order: ${f.order}` })}
      blank={{ question: "", answer: "", order: 0, visible: true }}
      testidPrefix="faq"
    />
  );
}

// -------------------- Gallery --------------------
function GalleryTab() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("General");

  const load = () => api.get("/gallery").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        await api.post(`/gallery/upload?title=${encodeURIComponent(f.name)}&category=${encodeURIComponent(category)}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch { toast.error(`Upload failed: ${f.name}`); }
    }
    setUploading(false);
    toast.success(`Uploaded ${files.length} file(s)`);
    e.target.value = "";
    load();
  };

  const toggleVisible = async (g) => {
    await api.put(`/gallery/${g.id}`, { ...g, visible: !g.visible });
    load();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`/gallery/${id}`);
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Gallery"
        subtitle="Upload unlimited photos and videos."
        action={
          <div className="flex gap-2 items-center">
            <input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm"
            />
            <label className="btn-primary sharp text-xs cursor-pointer">
              <UploadSimple size={14} /> Upload
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={upload} data-testid="gallery-upload-input" />
            </label>
          </div>
        }
      />
      {uploading && <p className="text-[#D4AF37] text-sm mb-4">Uploading…</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((g) => (
          <div key={g.id} className="glass-card sharp overflow-hidden group relative" data-testid={`gallery-admin-${g.id}`}>
            <div className="aspect-square">
              {g.media_type === "video" ? (
                <video src={`${BACKEND_URL}/api/files/${g.file_path}`} className="w-full h-full object-cover" />
              ) : (
                <img src={`${BACKEND_URL}/api/files/${g.file_path}`} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-3">
              <div className="text-xs text-white truncate">{g.title || "Untitled"}</div>
              <div className="text-[10px] text-[#94A3B8]">{g.category}</div>
              <div className="flex justify-between mt-2">
                <button onClick={() => toggleVisible(g)} className="text-[10px] text-[#D4AF37]">
                  {g.visible ? "Visible ✓" : "Hidden ✗"}
                </button>
                <button onClick={() => remove(g.id)} className="text-[#EF4444]"><Trash size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-[#94A3B8] col-span-full">No gallery items yet — upload some!</p>}
      </div>
    </div>
  );
}

// -------------------- Pickup requests --------------------
function PickupsTab() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/pickup").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    await api.delete(`/pickup/${id}`);
    load();
  };

  const setStatus = async (id, status) => {
    await api.put(`/pickup/${id}/status?status=${status}`);
    load();
  };

  return (
    <div>
      <SectionHeader title="Pickup Requests" subtitle="Customer scrap pickup requests received via the website." />
      <div className="glass-card sharp overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                {["Date", "Customer", "Mobile", "Type", "Qty", "Location", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#94A3B8] border-b border-white/5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#94A3B8]">No pickup requests yet.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 align-top" data-testid={`pickup-row-${r.id}`}>
                  <td className="px-4 py-3 text-[#94A3B8] text-xs">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-white text-sm">{r.name}</td>
                  <td className="px-4 py-3 text-[#D4AF37] text-sm">
                    <a href={`tel:${r.mobile}`}>{r.mobile}</a>
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{r.scrap_type}</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{r.quantity}</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{r.location}<div className="text-[10px] mt-1">{r.remarks}</div></td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="bg-[#060B14] border border-white/10 text-white sharp px-2 py-1 text-xs">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(r.id)} className="text-[#EF4444]"><Trash size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------- Generic CRUD Section --------------------
function CrudSection({ title, subtitle, endpoint, fields, display, blank, testidPrefix }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get(endpoint).then((r) => setItems(r.data));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

  const save = async (row) => {
    const payload = { ...row };
    for (const f of fields) {
      if (f.type === "number") payload[f.key] = Number(payload[f.key] || 0);
      if (f.type === "boolean") payload[f.key] = !!payload[f.key];
    }
    try {
      if (row.id) await api.put(`${endpoint}/${row.id}`, payload);
      else await api.post(endpoint, payload);
      toast.success("Saved");
      setEditing(null);
      load();
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`${endpoint}/${id}`);
    load();
  };

  return (
    <div>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={<button onClick={() => setEditing({ ...blank })} className="btn-primary sharp text-xs" data-testid={`${testidPrefix}-add-btn`}><Plus size={14} weight="bold" /> Add</button>}
      />

      {editing && (
        <div className="glass-card sharp p-6 mb-6" data-testid={`${testidPrefix}-editor`}>
          <div className="grid md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <label key={f.key} className="block md:col-span-1">
                <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">{f.label}</span>
                {f.type === "boolean" ? (
                  <select className="input-a" value={editing[f.key] ? "1" : "0"} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value === "1" })}>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                ) : f.textarea ? (
                  <textarea rows={3} className="input-a resize-none" value={editing[f.key] || ""} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                ) : (
                  <input type={f.type || "text"} className="input-a" value={editing[f.key] ?? ""} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                )}
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => save(editing)} className="btn-primary sharp text-xs">Save</button>
            <button onClick={() => setEditing(null)} className="btn-glass sharp text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => {
          const d = display(it);
          return (
            <div key={it.id} className="glass-card sharp p-4 flex items-start justify-between gap-4" data-testid={`${testidPrefix}-row-${it.id}`}>
              <div className="flex-1 min-w-0">
                <div className="text-white font-display">{d.primary}</div>
                <div className="text-[#94A3B8] text-sm mt-1 line-clamp-2">{d.secondary}</div>
                {d.meta && <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] mt-2">{d.meta}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...it })} className="text-[#D4AF37] hover:text-[#F0C420]"><PencilSimple size={16} /></button>
                <button onClick={() => remove(it.id)} className="text-[#EF4444]"><Trash size={16} /></button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-[#94A3B8]">No items yet.</p>}
      </div>
      <InputAStyles />
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
      <div>
        <h2 className="font-display text-2xl text-white">{title}</h2>
        {subtitle && <p className="text-[#94A3B8] text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">{label}</span>
      {children}
    </label>
  );
}

function InputAStyles() {
  return (
    <style>{`
      .input-a {
        width: 100%;
        background: #060B14;
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        padding: 10px 12px;
        font-size: 0.9rem;
        outline: none;
        transition: border-color .2s;
      }
      .input-a:focus { border-color: #D4AF37; }
    `}</style>
  );
}
