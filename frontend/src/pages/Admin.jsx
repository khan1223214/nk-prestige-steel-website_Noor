import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api, BACKEND_URL } from "../lib/api";
import { toast } from "sonner";
import SortableGalleryGrid from "../components/SortableGalleryGrid";
import {
  SignOut, CurrencyInr, Wrench, Images, ChatCircleDots, Question, Buildings, Truck, Briefcase,
  PencilSimple, Trash, Plus, UploadSimple, DownloadSimple, X, Check, ArrowSquareOut, Key,
  Wallet, ArrowUp, ArrowDown, Database, BellRinging, WhatsappLogo,
} from "@phosphor-icons/react";

const TABS = [
  { key: "info", label: "Business Info", icon: <Buildings size={16} /> },
  { key: "prices", label: "Scrap Prices", icon: <CurrencyInr size={16} /> },
  { key: "services", label: "Services", icon: <Wrench size={16} /> },
  { key: "projects", label: "Projects", icon: <Briefcase size={16} /> },
  { key: "gallery", label: "Gallery", icon: <Images size={16} /> },
  { key: "payments", label: "Payment Methods", icon: <Wallet size={16} /> },
  { key: "testimonials", label: "Testimonials", icon: <ChatCircleDots size={16} /> },
  { key: "faqs", label: "FAQ", icon: <Question size={16} /> },
  { key: "pickups", label: "Pickup Requests", icon: <Truck size={16} /> },
  { key: "alerts", label: "Price Alerts", icon: <BellRinging size={16} /> },
  { key: "backup", label: "Backup / Restore", icon: <Database size={16} /> },
  { key: "security", label: "Change Password", icon: <Key size={16} /> },
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
              data-testid={`admin-tab-${t.key}`}
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
          {tab === "projects" && <ProjectsTab />}
          {tab === "gallery" && <GalleryTab />}
          {tab === "payments" && <PaymentsTab />}
          {tab === "testimonials" && <TestimonialsTab />}
          {tab === "faqs" && <FaqsTab />}
          {tab === "pickups" && <PickupsTab />}
          {tab === "alerts" && <PriceAlertsTab />}
          {tab === "backup" && <BackupTab />}
          {tab === "security" && <SecurityTab />}
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
    api.get("/business-info").then((r) => setInfo({
      ...r.data,
      extra_phones: r.data.extra_phones || [],
      extra_whatsapps: r.data.extra_whatsapps || [],
      extra_emails: r.data.extra_emails || [],
      additional_addresses: r.data.additional_addresses || [],
    }));
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

  const updateListItem = (key, i, value) => {
    const list = [...(info[key] || [])];
    list[i] = value;
    setInfo({ ...info, [key]: list });
  };
  const addListItem = (key, value = "") => setInfo({ ...info, [key]: [...(info[key] || []), value] });
  const removeListItem = (key, i) => setInfo({ ...info, [key]: info[key].filter((_, idx) => idx !== i) });

  const updateAddress = (i, field, value) => {
    const list = [...(info.additional_addresses || [])];
    list[i] = { ...list[i], [field]: value };
    setInfo({ ...info, additional_addresses: list });
  };
  const addAddress = () => setInfo({
    ...info,
    additional_addresses: [...(info.additional_addresses || []), { label: "", address: "", maps_url: "" }],
  });
  const removeAddress = (i) => setInfo({
    ...info,
    additional_addresses: info.additional_addresses.filter((_, idx) => idx !== i),
  });

  const singleFields = [
    ["business_name", "Business Name"], ["tagline", "Tagline"], ["subtitle", "Hero Subtitle"],
    ["phone", "Primary Phone"], ["whatsapp", "Primary WhatsApp"], ["email", "Primary Email"],
    ["gst_number", "GST Number"], ["google_maps_url", "Google Maps URL"], ["working_hours", "Working Hours"],
    ["office_address", "Office Address"], ["godown_address", "Godown Address"],
    ["facebook", "Facebook URL"], ["instagram", "Instagram URL"], ["linkedin", "LinkedIn URL"],
    ["twitter", "Twitter URL"], ["youtube", "YouTube URL"],
    ["google_analytics_id", "Google Analytics ID (G-XXXXXXX)"],
    ["google_search_console_verification", "GSC Verification (meta content)"],
    ["seo_keywords", "SEO Keywords (comma-separated)"],
    ["favicon_url", "Favicon URL"],
    ["hero_image_url", "Hero Background Image URL (optional — replaces 3D scene)"],
    ["hero_cta_primary_label", "Hero CTA #1 Label"],
    ["hero_cta_primary_url", "Hero CTA #1 URL (tel:, https://, /path)"],
    ["hero_cta_secondary_label", "Hero CTA #2 Label"],
    ["hero_cta_secondary_url", "Hero CTA #2 URL"],
  ];

  const ListEditor = ({ label, k, placeholder }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="block text-xs uppercase tracking-widest text-[#94A3B8]">{label}</span>
        <button
          onClick={() => addListItem(k)}
          className="text-[10px] uppercase tracking-widest text-[#D4AF37] hover:text-[#F0C420] flex items-center gap-1"
          data-testid={`add-${k}`}
        >
          <Plus size={12} weight="bold" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {(info[k] || []).length === 0 && <p className="text-[10px] text-[#94A3B8] italic">None. Click "Add" to insert.</p>}
        {(info[k] || []).map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => updateListItem(k, i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm focus:border-[#D4AF37] outline-none"
              data-testid={`${k}-${i}`}
            />
            <button
              onClick={() => removeListItem(k, i)}
              className="text-[#EF4444] px-3 border border-[#EF4444]/30 hover:bg-[#EF4444]/10"
              data-testid={`remove-${k}-${i}`}
            >
              <Trash size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="Business Information" subtitle="These details appear across the site — contact bar, footer, contact page." />

      <div className="glass-card sharp p-6 grid md:grid-cols-2 gap-4">
        {singleFields.map(([k, label]) => (
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

      {/* Extra contacts */}
      <div className="glass-card sharp p-6 mt-4">
        <h3 className="font-display text-white text-lg mb-1">Additional Contacts</h3>
        <p className="text-[#94A3B8] text-xs mb-5">Extra phone numbers, WhatsApp numbers, and emails shown across the site alongside the primary ones.</p>
        <div className="grid md:grid-cols-3 gap-6">
          <ListEditor label="Extra Phones" k="extra_phones" placeholder="+91 XXXXXXXXXX" />
          <ListEditor label="Extra WhatsApp Numbers" k="extra_whatsapps" placeholder="+91 XXXXXXXXXX" />
          <ListEditor label="Extra Emails" k="extra_emails" placeholder="branch@example.com" />
        </div>
      </div>

      {/* Additional addresses */}
      <div className="glass-card sharp p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-white text-lg">Additional Locations</h3>
            <p className="text-[#94A3B8] text-xs">Add branches, yards, or additional office locations beyond Office and Godown.</p>
          </div>
          <button onClick={addAddress} className="btn-glass sharp text-xs" data-testid="add-address">
            <Plus size={12} weight="bold" /> Add Location
          </button>
        </div>
        <div className="space-y-4">
          {(info.additional_addresses || []).length === 0 && (
            <p className="text-[10px] text-[#94A3B8] italic">No additional addresses.</p>
          )}
          {(info.additional_addresses || []).map((a, i) => (
            <div key={i} className="grid md:grid-cols-3 gap-3 border border-white/10 p-4" data-testid={`address-${i}`}>
              <input
                value={a.label || ""}
                onChange={(e) => updateAddress(i, "label", e.target.value)}
                placeholder="Label (e.g., Bangalore Branch)"
                className="bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm focus:border-[#D4AF37] outline-none"
              />
              <input
                value={a.address || ""}
                onChange={(e) => updateAddress(i, "address", e.target.value)}
                placeholder="Full address"
                className="bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm focus:border-[#D4AF37] outline-none md:col-span-2"
              />
              <input
                value={a.maps_url || ""}
                onChange={(e) => updateAddress(i, "maps_url", e.target.value)}
                placeholder="Google Maps URL (optional)"
                className="bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm focus:border-[#D4AF37] outline-none md:col-span-2"
              />
              <button
                onClick={() => removeAddress(i)}
                className="text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 sharp text-xs px-3"
              >
                <Trash size={12} /> Remove
              </button>
            </div>
          ))}
        </div>
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

// -------------------- Projects --------------------
function ProjectsTab() {
  return (
    <CrudSection
      title="Completed Projects"
      subtitle="Signature case studies shown on the /projects page."
      endpoint="/projects"
      fields={[
        { key: "title", label: "Project Title" },
        { key: "description", label: "Description", textarea: true },
        { key: "location", label: "Location" },
        { key: "customer", label: "Customer / Client" },
        { key: "completion_date", label: "Completion Date (e.g., Mar 2026)" },
        { key: "image_url", label: "Cover Image URL (public link)" },
        { key: "order", label: "Order", type: "number" },
        { key: "visible", label: "Visible", type: "boolean" },
      ]}
      display={(p) => ({ primary: p.title, secondary: p.description, meta: [p.customer, p.location, p.completion_date].filter(Boolean).join(" · ") })}
      blank={{ title: "", description: "", location: "", customer: "", completion_date: "", image_url: "", order: 0, visible: true }}
      testidPrefix="project"
    />
  );
}

// -------------------- Payment Methods --------------------
function PaymentsTab() {
  const KINDS = ["UPI", "BANK", "NEFT", "RTGS", "CASH", "CHEQUE", "OTHER"];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const blank = { kind: "UPI", label: "", details: "", qr_image_url: "", enabled: true, order: 0 };

  const load = () => api.get("/payment-methods").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const uploadQr = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const { data } = await api.post("/upload-image?folder=payments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing((prev) => ({ ...prev, qr_image_url: data.path }));
      toast.success("QR uploaded");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
    e.target.value = "";
  };

  const save = async () => {
    const payload = {
      kind: editing.kind, label: editing.label, details: editing.details || "",
      qr_image_url: editing.qr_image_url || null,
      enabled: !!editing.enabled, order: Number(editing.order || 0),
    };
    try {
      if (editing.id) await api.put(`/payment-methods/${editing.id}`, payload);
      else await api.post("/payment-methods", payload);
      toast.success("Saved");
      setEditing(null);
      load();
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this payment method?")) return;
    await api.delete(`/payment-methods/${id}`);
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Payment Methods"
        subtitle="Manage UPI, Bank, Cash, Cheque, NEFT, RTGS options shown on the /payments page."
        action={<button onClick={() => setEditing({ ...blank })} className="btn-primary sharp text-xs" data-testid="payment-add-btn"><Plus size={14} weight="bold" /> Add Method</button>}
      />

      {editing && (
        <div className="glass-card sharp p-6 mb-6" data-testid="payment-editor">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Type</span>
              <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} className="input-a">
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Label</span>
              <input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="input-a" />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Details (multi-line: A/C, IFSC, UPI ID, etc.)</span>
              <textarea rows={4} value={editing.details} onChange={(e) => setEditing({ ...editing, details: e.target.value })} className="input-a resize-none font-mono text-xs" />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">QR Image (optional)</span>
              <input type="file" accept="image/*" onChange={uploadQr} className="text-xs text-[#94A3B8]" />
              {uploading && <span className="text-xs text-[#D4AF37] block mt-1">Uploading…</span>}
              {editing.qr_image_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={editing.qr_image_url.startsWith("http") ? editing.qr_image_url : `${BACKEND_URL}/api/files/${editing.qr_image_url}`} alt="QR" className="w-20 h-20 object-contain bg-white p-1" />
                  <button onClick={() => setEditing({ ...editing, qr_image_url: "" })} className="text-[#EF4444] text-xs">Remove</button>
                </div>
              )}
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Enabled</span>
              <select value={editing.enabled ? "1" : "0"} onChange={(e) => setEditing({ ...editing, enabled: e.target.value === "1" })} className="input-a">
                <option value="1">Yes — visible</option>
                <option value="0">No — hidden</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Order</span>
              <input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: e.target.value })} className="input-a" />
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary sharp text-xs">Save</button>
            <button onClick={() => setEditing(null)} className="btn-glass sharp text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="glass-card sharp p-4 flex items-start gap-4" data-testid={`payment-row-${p.id}`}>
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] w-16 shrink-0">{p.kind}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-display">{p.label}</div>
              <div className="text-[#94A3B8] text-xs mt-1 whitespace-pre-wrap font-mono">{p.details}</div>
              <div className="text-[10px] text-[#94A3B8] mt-2">{p.enabled ? "✓ Visible" : "✗ Hidden"} · Order: {p.order}</div>
            </div>
            {p.qr_image_url && (
              <img src={p.qr_image_url.startsWith("http") ? p.qr_image_url : `${BACKEND_URL}/api/files/${p.qr_image_url}`} alt="QR" className="w-14 h-14 bg-white p-0.5" />
            )}
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditing({ ...p })} className="text-[#D4AF37]"><PencilSimple size={16} /></button>
              <button onClick={() => remove(p.id)} className="text-[#EF4444]"><Trash size={16} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-[#94A3B8]">No payment methods yet.</p>}
      </div>
      <InputAStyles />
    </div>
  );
}

// -------------------- Backup / Restore --------------------
function BackupTab() {
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState(null);

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get("/backup", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nk-prestige-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch { toast.error("Backup failed"); }
    setBusy(false);
  };

  const restore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm(replace ? "This will REPLACE all data. Continue?" : "Merge/upsert this backup into current data?")) {
      e.target.value = "";
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/restore?replace=${replace}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRestoreSummary(data.restored);
      toast.success("Restore complete");
    } catch { toast.error("Restore failed"); }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div>
      <SectionHeader title="Backup & Restore" subtitle="Full site data export/import — business info, prices, services, gallery, projects, payment methods, testimonials, FAQ, and pickup requests." />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card sharp p-6">
          <div className="text-[#D4AF37] mb-3"><DownloadSimple size={22} weight="duotone" /></div>
          <h3 className="font-display text-white text-lg mb-1">Export Backup</h3>
          <p className="text-[#94A3B8] text-sm mb-5">Downloads a versioned JSON snapshot of the entire site database. Save it somewhere safe.</p>
          <button onClick={download} disabled={busy} className="btn-primary sharp text-xs" data-testid="backup-download-btn">
            <DownloadSimple size={14} weight="bold" /> {busy ? "Preparing…" : "Download Backup"}
          </button>
        </div>

        <div className="glass-card sharp p-6">
          <div className="text-[#D4AF37] mb-3"><UploadSimple size={22} weight="duotone" /></div>
          <h3 className="font-display text-white text-lg mb-1">Restore from Backup</h3>
          <p className="text-[#94A3B8] text-sm mb-4">Upload a previously exported backup JSON to restore your site.</p>
          <label className="flex items-center gap-2 text-xs text-[#94A3B8] mb-3">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="accent-[#D4AF37]" data-testid="backup-replace-toggle" />
            Replace all data (danger — deletes current data first)
          </label>
          <label className="btn-glass sharp text-xs cursor-pointer inline-flex" data-testid="backup-restore-btn">
            <UploadSimple size={14} /> Choose Backup File
            <input type="file" accept=".json,application/json" className="hidden" onChange={restore} />
          </label>
          {restoreSummary && (
            <div className="mt-4 text-xs text-[#94A3B8]" data-testid="restore-summary">
              <div className="text-[#D4AF37] uppercase tracking-widest mb-1">Restored</div>
              {Object.entries(restoreSummary).map(([c, n]) => (
                <div key={c}>{c}: <span className="text-white">{n}</span> docs</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- Security / Change Password --------------------
function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      toast.success("Password updated. Please sign in again next time.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Change failed");
    }
    setBusy(false);
  };

  return (
    <div className="max-w-lg">
      <SectionHeader title="Change Password" subtitle="Rotate your admin password regularly." />
      <form onSubmit={submit} className="glass-card sharp p-6 space-y-4" data-testid="change-password-form">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Current Password</span>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
            className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm"
            data-testid="change-password-current" />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">New Password (min 8 chars)</span>
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)}
            className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm"
            data-testid="change-password-new" />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Confirm New Password</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm"
            data-testid="change-password-confirm" />
        </label>
        <button disabled={busy} className="btn-primary sharp text-xs" data-testid="change-password-submit">
          <Check size={14} weight="bold" /> {busy ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
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

  return (
    <div>
      <SectionHeader
        title="Gallery"
        subtitle="Upload unlimited photos and videos. Drag any tile by its handle to reorder — the order updates instantly on the public site."
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
      <SortableGalleryGrid items={items} setItems={setItems} />
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

function PriceAlertsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/price-alerts").then((r) => {
      setRows(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const remove = async (phone) => {
    if (!window.confirm("Remove this subscriber?")) return;
    await api.delete(`/price-alerts/${encodeURIComponent(phone)}`);
    toast.success("Subscriber removed");
    load();
  };

  const waLink = (phone, name) => {
    const msg = encodeURIComponent(`Hi ${name || "there"}, today's scrap rates from NK Prestige Steel:`);
    return `https://wa.me/91${phone}?text=${msg}`;
  };

  return (
    <div>
      <SectionHeader
        title="WhatsApp Price Alerts"
        subtitle="Subscribers who opted in from the Prices page. Click ‘Message on WhatsApp’ to send them today's rates in one click."
      />
      {loading ? (
        <p className="text-[#94A3B8]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="glass-card sharp p-10 text-center">
          <BellRinging size={28} className="mx-auto text-[#D4AF37] mb-3" />
          <p className="text-white/80 mb-1">No subscribers yet</p>
          <p className="text-xs text-[#94A3B8]">They'll appear here as soon as customers opt in from the Prices page.</p>
        </div>
      ) : (
        <div className="glass-card sharp overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {["Name", "Phone", "Alert Metals", "Subscribed", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs uppercase tracking-widest text-[#94A3B8] border-b border-white/5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.phone} className="border-b border-white/5 align-top" data-testid={`price-alert-row-${r.phone}`}>
                    <td className="px-6 py-4 text-white">{r.name || <span className="text-[#94A3B8]">—</span>}</td>
                    <td className="px-6 py-4 text-[#D4AF37] font-mono">+91 {r.phone}</td>
                    <td className="px-6 py-4">
                      {r.metals?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {r.metals.map((m) => (
                            <span key={m} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-white/10 text-white/70 sharp">{m}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] text-xs">All metals</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={waLink(r.phone, r.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white sharp text-xs font-semibold hover:opacity-90"
                          data-testid={`price-alert-wa-${r.phone}`}
                        >
                          <WhatsappLogo size={14} weight="fill" /> Message
                        </a>
                        <button
                          onClick={() => remove(r.phone)}
                          className="p-2 border border-white/10 text-white/70 hover:text-red-400 hover:border-red-400/40 sharp"
                          data-testid={`price-alert-delete-${r.phone}`}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
