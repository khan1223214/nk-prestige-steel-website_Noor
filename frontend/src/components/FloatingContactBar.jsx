import React from "react";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, ArrowUp } from "@phosphor-icons/react";

/**
 * Floating one-click contact bar — visible on every page (except admin).
 */
export default function FloatingContactBar({ info }) {
  if (!info) return null;

  const phone = (info.phone || "").replace(/\s|\+/g, "");
  const wa = (info.whatsapp || "").replace(/\s|\+/g, "");

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const items = [
    { icon: <Phone size={20} weight="bold" />, href: `tel:${info.phone}`, label: "Call", testid: "float-call", color: "#10B981" },
    { icon: <WhatsappLogo size={20} weight="bold" />, href: `https://wa.me/${wa}`, label: "WhatsApp", testid: "float-whatsapp", color: "#25D366" },
    { icon: <EnvelopeSimple size={20} weight="bold" />, href: `mailto:${info.email}`, label: "Email", testid: "float-email", color: "#D4AF37" },
    { icon: <MapPin size={20} weight="bold" />, href: info.google_maps_url, label: "Maps", testid: "float-maps", color: "#EF4444" },
  ];

  return (
    <div className="fixed z-30 right-4 bottom-6 flex flex-col gap-3" data-testid="floating-contact-bar">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.label !== "Call" && it.label !== "Email" ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="group relative w-12 h-12 sharp flex items-center justify-center glass-card hover:gold-glow transition-all hover:-translate-y-1"
          data-testid={it.testid}
          aria-label={it.label}
          style={{ color: it.color }}
        >
          {it.icon}
          <span className="absolute right-full mr-3 px-3 py-1.5 text-xs uppercase tracking-widest bg-[#141A2E] border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            {it.label}
          </span>
        </a>
      ))}
      <button
        onClick={scrollTop}
        className="w-12 h-12 sharp flex items-center justify-center bg-[#D4AF37] text-[#060B14] hover:bg-[#F0C420] transition-all hover:-translate-y-1"
        data-testid="float-back-top"
        aria-label="Back to top"
      >
        <ArrowUp size={20} weight="bold" />
      </button>
    </div>
  );
}
