import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { List, X, Translate } from "@phosphor-icons/react";
import { useI18n } from "../lib/i18n";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t, lang, toggle } = useI18n();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/prices", label: t("nav.prices") },
    { to: "/services", label: t("nav.services") },
    { to: "/projects", label: "Projects" },
    { to: "/gallery", label: t("nav.gallery") },
    { to: "/payments", label: "Payments" },
    { to: "/pickup", label: t("nav.pickup") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-40" data-testid="site-header">
      <div className="section-container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8a6f18] sharp group-hover:gold-glow transition-all">
            <span className="font-display font-bold text-[#060B14] text-lg">NK</span>
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-semibold text-white text-sm leading-tight">NK Prestige Steel</div>
            <div className="text-[10px] tracking-[0.24em] uppercase text-[#94A3B8]">Corporation</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${i}`}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium tracking-wide transition-colors ${
                  isActive ? "text-[#D4AF37]" : "text-white/80 hover:text-[#D4AF37]"
                }`
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:border-[#D4AF37]/50 text-white/80 hover:text-[#D4AF37] transition-colors text-xs uppercase tracking-widest"
            data-testid="lang-toggle"
            aria-label="Switch language"
          >
            <Translate size={14} weight="bold" />
            {t("lang.switch")}
          </button>
          <Link to="/pickup" className="btn-primary sharp text-xs" data-testid="nav-cta-quote">
            {t("nav.quote")}
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-white p-2"
          data-testid="nav-menu-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden glass-header border-t border-white/5" data-testid="mobile-menu">
          <div className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 text-sm ${isActive ? "text-[#D4AF37]" : "text-white/85"}`
                }
                end={l.to === "/"}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { toggle(); setOpen(false); }}
                className="btn-glass sharp text-xs flex-1 justify-center"
              >
                <Translate size={14} weight="bold" /> {t("lang.switch")}
              </button>
              <Link to="/pickup" onClick={() => setOpen(false)} className="btn-primary sharp text-xs flex-1 justify-center">
                {t("nav.quote")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
