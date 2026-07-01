import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";

const links = [
  { to: "/", label: "Home" },
  { to: "/prices", label: "Live Prices" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pickup", label: "Request Pickup" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
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

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/pickup" className="btn-primary sharp text-xs" data-testid="nav-cta-quote">
            Get Quote
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
            <Link to="/pickup" onClick={() => setOpen(false)} className="btn-primary sharp text-xs mt-2 justify-center">
              Get Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
