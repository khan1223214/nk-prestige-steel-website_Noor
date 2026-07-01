import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Truck, UploadSimple, X, Phone, WhatsappLogo } from "@phosphor-icons/react";

export default function Pickup({ info }) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    scrap_type: "",
    quantity: "",
    location: "",
    remarks: "",
  });
  const [services, setServices] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  useEffect(() => {
    api.get("/services?only_visible=true").then((r) => setServices(r.data));
  }, []);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingCount(files.length);
    const results = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await api.post("/pickup/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push({ path: data.path, name: file.name, isVideo: file.type.startsWith("video/") });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploads((prev) => [...prev, ...results]);
    setUploadingCount(0);
    e.target.value = "";
  };

  const removeUpload = (idx) => setUploads((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/pickup", {
        ...form,
        media_paths: uploads.map((u) => u.path),
      });
      toast.success("Pickup request submitted! Our team will contact you shortly.");
      setForm({ name: "", mobile: "", scrap_type: "", quantity: "", location: "", remarks: "" });
      setUploads([]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="pt-24 pb-20" data-testid="pickup-page">
      <div className="section-container">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Free Doorstep Service</div>
            <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Request Scrap Pickup</h1>
            <p className="text-[#94A3B8] mt-4 max-w-xl">
              Fill this quick form — our team will call you within 30 minutes with a firm quote and pickup slot. Free pickup across Karnataka.
            </p>

            <form onSubmit={submit} className="mt-8 glass-card sharp p-6 md:p-8 space-y-5" data-testid="pickup-form">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark"
                    data-testid="pickup-name-input"
                  />
                </Field>
                <Field label="Mobile Number" required>
                  <input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="input-dark"
                    data-testid="pickup-mobile-input"
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Scrap Type" required>
                  <select
                    required
                    value={form.scrap_type}
                    onChange={(e) => setForm({ ...form, scrap_type: e.target.value })}
                    className="input-dark"
                    data-testid="pickup-type-select"
                  >
                    <option value="">Select scrap type…</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                    <option value="Mixed / Other">Mixed / Other</option>
                  </select>
                </Field>
                <Field label="Approximate Quantity" required>
                  <input
                    required
                    placeholder="e.g., 500 kg, 2 tons"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input-dark"
                    data-testid="pickup-quantity-input"
                  />
                </Field>
              </div>

              <Field label="Pickup Location / Address" required>
                <input
                  required
                  placeholder="Area, city, pincode"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input-dark"
                  data-testid="pickup-location-input"
                />
              </Field>

              <Field label="Remarks (optional)">
                <textarea
                  rows={3}
                  placeholder="Any specific requirements, access notes, best time to call…"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="input-dark resize-none"
                  data-testid="pickup-remarks-input"
                />
              </Field>

              <Field label="Upload Photos / Videos (optional)">
                <label className="flex items-center gap-3 cursor-pointer border border-dashed border-white/15 hover:border-[#D4AF37]/50 px-4 py-6 sharp bg-[#060B14] transition-colors">
                  <UploadSimple size={20} className="text-[#D4AF37]" />
                  <div>
                    <div className="text-sm text-white">Click to upload files</div>
                    <div className="text-xs text-[#94A3B8]">PNG, JPG, MP4 — multiple allowed</div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={onFiles}
                    data-testid="pickup-media-input"
                  />
                </label>
                {uploadingCount > 0 && <p className="text-xs text-[#D4AF37] mt-2">Uploading {uploadingCount} file(s)…</p>}
                {uploads.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3" data-testid="pickup-uploads-preview">
                    {uploads.map((u, i) => (
                      <div key={i} className="relative aspect-square glass-card sharp overflow-hidden group">
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-center text-white p-2">
                          {u.isVideo ? "🎥" : "🖼️"} {u.name.slice(0, 12)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUpload(i)}
                          className="absolute top-1 right-1 bg-[#EF4444] text-white sharp w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <button
                disabled={busy || uploadingCount > 0}
                className="btn-primary sharp w-full justify-center"
                data-testid="pickup-submit-btn"
              >
                <Truck size={16} weight="bold" /> {busy ? "Submitting…" : "Submit Pickup Request"}
              </button>
            </form>
          </div>

          <aside className="lg:col-span-2 space-y-4">
            <div className="glass-card sharp p-6" data-testid="pickup-quick-contact">
              <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Prefer to talk?</div>
              <h3 className="font-display text-2xl text-white mb-2">Direct contact</h3>
              <p className="text-[#94A3B8] text-sm mb-5">Skip the form and connect with the owner instantly.</p>
              <div className="space-y-2">
                <a href={`tel:${info?.phone}`} className="btn-primary sharp w-full justify-center">
                  <Phone size={16} weight="bold" /> Call {info?.phone}
                </a>
                <a
                  href={`https://wa.me/${(info?.whatsapp || "").replace(/\s|\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass sharp w-full justify-center"
                >
                  <WhatsappLogo size={16} weight="bold" /> WhatsApp
                </a>
              </div>
            </div>

            <div className="glass-card sharp p-6">
              <h4 className="font-display text-white text-lg mb-3">Why choose us?</h4>
              <ul className="space-y-3 text-sm text-[#94A3B8]">
                <li>✓ Free pickup for orders above 100 kg</li>
                <li>✓ Instant payment via UPI / NEFT / cash</li>
                <li>✓ Digital weighing with transparent tare</li>
                <li>✓ GST invoicing for corporate buyers</li>
                <li>✓ 15+ years of trusted service</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .input-dark {
          width: 100%;
          background: #060B14;
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 12px 14px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color .2s;
        }
        .input-dark:focus { border-color: #D4AF37; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">
        {label} {required && <span className="text-[#D4AF37]">*</span>}
      </span>
      {children}
    </label>
  );
}
