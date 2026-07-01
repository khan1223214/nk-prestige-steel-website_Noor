import React from "react";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, Clock, IdentificationCard, Buildings, Warehouse } from "@phosphor-icons/react";
import Seo from "../components/Seo";

export default function Contact({ info }) {
  if (!info) return null;

  const wa = (n) => (n || "").replace(/\s|\+/g, "");
  const allPhones = [info.phone, ...(info.extra_phones || [])].filter(Boolean);
  const allWhatsapps = [info.whatsapp, ...(info.extra_whatsapps || [])].filter(Boolean);
  const allEmails = [info.email, ...(info.extra_emails || [])].filter(Boolean);
  const allAddresses = [
    { label: "Head Office", address: info.office_address, icon: <Buildings size={20} weight="duotone" /> },
    { label: "Godown / Storage Yard", address: info.godown_address, icon: <Warehouse size={20} weight="duotone" /> },
    ...(info.additional_addresses || []).map((a) => ({
      label: a.label || "Additional Location",
      address: a.address,
      maps_url: a.maps_url,
      icon: <MapPin size={20} weight="duotone" />,
    })),
  ].filter((a) => a.address);

  const mapsQuery = encodeURIComponent(info.office_address || "");

  return (
    <div className="pt-24 pb-20" data-testid="contact-page">
      <Seo
        title="Contact NK Prestige Steel Corporation — Ramanagara Karnataka"
        description={`Call ${info.phone}, WhatsApp us, or visit our office/godown in Ramanagara. GST ${info.gst_number}.`}
        path="/contact"
      />
      <div className="section-container">
        <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Get In Touch</div>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Contact Us</h1>
        <p className="text-[#94A3B8] mt-4 max-w-2xl">
          Multiple ways to reach us — call, WhatsApp, email, or visit our locations across Ramanagara district during working hours.
        </p>

        {/* All addresses */}
        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          {allAddresses.map((a, i) => (
            <div key={i} className="glass-card sharp p-8" data-testid={`contact-address-${i}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
                  {a.icon}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Location</div>
                  <div className="font-display text-white text-lg">{a.label}</div>
                </div>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">{a.address}</p>
              <a
                href={a.maps_url || `https://maps.google.com/?q=${encodeURIComponent(a.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary sharp mt-6 text-xs"
              >
                <MapPin size={14} weight="bold" /> Navigate
              </a>
            </div>
          ))}
        </div>

        {/* All contact methods */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {/* Phones */}
          <div className="glass-card sharp p-6" data-testid="contact-phones-card">
            <div className="text-[#D4AF37] mb-3"><Phone size={20} weight="duotone" /></div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-3">Call Owner</div>
            <div className="space-y-2">
              {allPhones.map((p, i) => (
                <a key={i} href={`tel:${p}`} className="flex items-center gap-2 text-white hover:text-[#D4AF37] transition-colors" data-testid={`contact-phone-${i}`}>
                  <span className="text-sm">{p}</span>
                  {i === 0 && <span className="text-[9px] px-1.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] uppercase tracking-wider">Primary</span>}
                </a>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="glass-card sharp p-6" data-testid="contact-wa-card">
            <div className="text-[#25D366] mb-3"><WhatsappLogo size={20} weight="duotone" /></div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-3">WhatsApp</div>
            <div className="space-y-2">
              {allWhatsapps.map((w, i) => (
                <a key={i} href={`https://wa.me/${wa(w)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-[#25D366] transition-colors" data-testid={`contact-wa-${i}`}>
                  <span className="text-sm">{w}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Emails */}
          <div className="glass-card sharp p-6" data-testid="contact-emails-card">
            <div className="text-[#D4AF37] mb-3"><EnvelopeSimple size={20} weight="duotone" /></div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-3">Email</div>
            <div className="space-y-2">
              {allEmails.map((e, i) => (
                <a key={i} href={`mailto:${e}`} className="block text-white hover:text-[#D4AF37] transition-colors break-all text-sm" data-testid={`contact-email-${i}`}>
                  {e}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="glass-card sharp p-6" data-testid="contact-hours-card">
            <div className="text-[#D4AF37] mb-3"><Clock size={20} weight="duotone" /></div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Working Hours</div>
            <div className="text-white">{info.working_hours}</div>
          </div>
          <div className="glass-card sharp p-6" data-testid="contact-gst-card">
            <div className="text-[#D4AF37] mb-3"><IdentificationCard size={20} weight="duotone" /></div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-2">GST Number</div>
            <div className="text-white font-mono tracking-wide">{info.gst_number}</div>
          </div>
        </div>

        {/* Map */}
        <div className="glass-card sharp mt-6 overflow-hidden" data-testid="contact-map">
          <iframe
            title="NK Prestige Steel Location"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="w-full h-[420px] border-0 grayscale"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
