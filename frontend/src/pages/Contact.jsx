import React from "react";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, Clock, IdentificationCard, Buildings, Warehouse } from "@phosphor-icons/react";

export default function Contact({ info }) {
  if (!info) return null;

  const items = [
    { icon: <Phone size={20} weight="duotone" />, label: "Call Owner", value: info.phone, href: `tel:${info.phone}`, testid: "contact-call" },
    { icon: <WhatsappLogo size={20} weight="duotone" />, label: "WhatsApp", value: info.whatsapp, href: `https://wa.me/${(info.whatsapp || "").replace(/\s|\+/g, "")}`, testid: "contact-whatsapp" },
    { icon: <EnvelopeSimple size={20} weight="duotone" />, label: "Email", value: info.email, href: `mailto:${info.email}`, testid: "contact-email" },
    { icon: <Clock size={20} weight="duotone" />, label: "Working Hours", value: info.working_hours, testid: "contact-hours" },
    { icon: <IdentificationCard size={20} weight="duotone" />, label: "GST Number", value: info.gst_number, testid: "contact-gst" },
  ];

  const mapsQuery = encodeURIComponent(info.office_address);

  return (
    <div className="pt-24 pb-20" data-testid="contact-page">
      <div className="section-container">
        <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Get In Touch</div>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Contact Us</h1>
        <p className="text-[#94A3B8] mt-4 max-w-2xl">
          Two locations across Ramanagara district. Call or WhatsApp for immediate response, or visit us during working hours.
        </p>

        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          <div className="glass-card sharp p-8" data-testid="contact-office-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
                <Buildings size={20} weight="duotone" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Office</div>
                <div className="font-display text-white text-lg">Head Office</div>
              </div>
            </div>
            <p className="text-[#94A3B8] leading-relaxed">{info.office_address}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(info.office_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary sharp mt-6 text-xs"
            >
              <MapPin size={14} weight="bold" /> Navigate
            </a>
          </div>

          <div className="glass-card sharp p-8" data-testid="contact-godown-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
                <Warehouse size={20} weight="duotone" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Godown</div>
                <div className="font-display text-white text-lg">Storage & Weighing Yard</div>
              </div>
            </div>
            <p className="text-[#94A3B8] leading-relaxed">{info.godown_address}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(info.godown_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary sharp mt-6 text-xs"
            >
              <MapPin size={14} weight="bold" /> Navigate
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href || "#"}
              target={it.href?.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="glass-card sharp p-6 hover-lift block"
              data-testid={it.testid}
            >
              <div className="text-[#D4AF37] mb-3">{it.icon}</div>
              <div className="text-xs uppercase tracking-widest text-[#94A3B8]">{it.label}</div>
              <div className="text-white font-medium mt-1 break-words">{it.value}</div>
            </a>
          ))}
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
