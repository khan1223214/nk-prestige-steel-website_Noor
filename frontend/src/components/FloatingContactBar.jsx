import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, ArrowUp, DotsThreeVertical, X } from "@phosphor-icons/react";

/**
 * Floating one-click contact bar — visible on every public page.
 * Shows primary phone/whatsapp/email/maps, plus an expander for extra numbers.
 */
export default function FloatingContactBar({ info }) {
  const [showExtras, setShowExtras] = useState(false);
  if (!info) return null;

  const extras = {
    phones: info.extra_phones || [],
    whatsapps: info.extra_whatsapps || [],
    emails: info.extra_emails || [],
  };
  const hasExtras = extras.phones.length + extras.whatsapps.length + extras.emails.length > 0;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const wa = (n) => (n || "").replace(/\s|\+/g, "");

  const primary = [
    { icon: <Phone size={20} weight="bold" />, href: `tel:${info.phone}`, label: "Call", testid: "float-call", color: "#10B981" },
    { icon: <WhatsappLogo size={20} weight="bold" />, href: `https://wa.me/${wa(info.whatsapp)}`, label: "WhatsApp", testid: "float-whatsapp", color: "#25D366" },
    { icon: <EnvelopeSimple size={20} weight="bold" />, href: `mailto:${info.email}`, label: "Email", testid: "float-email", color: "#D4AF37" },
    { icon: <MapPin size={20} weight="bold" />, href: info.google_maps_url, label: "Maps", testid: "float-maps", color: "#EF4444" },
  ];

  return (
    <div className="fixed z-30 right-4 bottom-6 flex flex-col gap-3" data-testid="floating-contact-bar">
      {/* Expanded extras panel */}
      <AnimatePresence>
        {showExtras && hasExtras && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-16 bottom-0 glass-card sharp p-4 w-64 max-h-[70vh] overflow-y-auto"
            data-testid="float-extras-panel"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">More Contacts</span>
              <button onClick={() => setShowExtras(false)}><X size={14} className="text-white/60" /></button>
            </div>
            {extras.phones.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1">Phone</div>
                {extras.phones.map((p, i) => (
                  <a key={i} href={`tel:${p}`} className="flex items-center gap-2 text-sm text-white hover:text-[#D4AF37] py-1" data-testid={`float-extra-phone-${i}`}>
                    <Phone size={14} weight="bold" /> {p}
                  </a>
                ))}
              </div>
            )}
            {extras.whatsapps.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1">WhatsApp</div>
                {extras.whatsapps.map((w, i) => (
                  <a key={i} href={`https://wa.me/${wa(w)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white hover:text-[#D4AF37] py-1" data-testid={`float-extra-wa-${i}`}>
                    <WhatsappLogo size={14} weight="bold" /> {w}
                  </a>
                ))}
              </div>
            )}
            {extras.emails.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1">Email</div>
                {extras.emails.map((e, i) => (
                  <a key={i} href={`mailto:${e}`} className="flex items-center gap-2 text-sm text-white hover:text-[#D4AF37] py-1 break-all" data-testid={`float-extra-email-${i}`}>
                    <EnvelopeSimple size={14} weight="bold" /> {e}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {primary.map((it) => (
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

      {hasExtras && (
        <button
          onClick={() => setShowExtras(!showExtras)}
          className="w-12 h-12 sharp flex items-center justify-center glass-card hover:gold-glow transition-all hover:-translate-y-1 text-[#D4AF37]"
          data-testid="float-extras-toggle"
          aria-label="More contacts"
        >
          <DotsThreeVertical size={22} weight="bold" />
        </button>
      )}

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
