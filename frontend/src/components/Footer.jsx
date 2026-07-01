import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, FacebookLogo, InstagramLogo, LinkedinLogo, TwitterLogo, YoutubeLogo } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function Footer({ info }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Subscribed! You'll get the latest scrap price updates.");
      setEmail("");
    } catch (err) {
      toast.error("Please enter a valid email.");
    }
    setBusy(false);
  };

  if (!info) return null;

  return (
    <footer className="border-t border-white/5 bg-[#050912] mt-24 relative overflow-hidden" data-testid="site-footer">
      <div className="noise-overlay" />
      <div className="section-container py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8a6f18] sharp">
                <span className="font-display font-bold text-[#060B14] text-xl">NK</span>
              </div>
              <div>
                <div className="font-display text-xl text-white">{info.business_name}</div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">GST: {info.gst_number}</div>
              </div>
            </div>
            <p className="text-[#94A3B8] leading-relaxed text-sm max-w-md">
              {info.tagline}. We are Karnataka's premium scrap recycling partner buying ferrous, non-ferrous, electronic,
              and industrial scrap at the best market rates.
            </p>

            {/* Newsletter */}
            <form onSubmit={subscribe} className="mt-6 flex max-w-md" data-testid="newsletter-form">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get daily scrap price updates"
                className="flex-1 bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none text-sm"
                data-testid="newsletter-email-input"
              />
              <button
                disabled={busy}
                className="btn-primary sharp text-xs px-6"
                data-testid="newsletter-submit"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-[#D4AF37] text-sm uppercase tracking-[0.2em] mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {["/", "/prices", "/services", "/gallery", "/pickup", "/contact"].map((p, i) => (
                <li key={p}>
                  <Link to={p} className="text-[#94A3B8] hover:text-[#D4AF37] transition-colors" data-testid={`footer-link-${i}`}>
                    {["Home", "Live Prices", "Services", "Gallery", "Request Pickup", "Contact"][i]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-[#D4AF37] text-sm uppercase tracking-[0.2em] mb-5">Reach Us</h4>
            <ul className="space-y-3 text-sm text-[#94A3B8]">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 shrink-0 text-[#D4AF37]" size={16} />
                <a href={`tel:${info.phone}`}>{info.phone}</a>
              </li>
              <li className="flex items-start gap-2">
                <WhatsappLogo className="mt-0.5 shrink-0 text-[#D4AF37]" size={16} />
                <a href={`https://wa.me/${(info.whatsapp || "").replace(/\s|\+/g, "")}`} target="_blank" rel="noopener noreferrer">
                  {info.whatsapp}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <EnvelopeSimple className="mt-0.5 shrink-0 text-[#D4AF37]" size={16} />
                <a href={`mailto:${info.email}`}>{info.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 shrink-0 text-[#D4AF37]" size={16} />
                <span>{info.office_address}</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              {info.facebook && <a href={info.facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#D4AF37]"><FacebookLogo size={18} /></a>}
              {info.instagram && <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#D4AF37]"><InstagramLogo size={18} /></a>}
              {info.linkedin && <a href={info.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#D4AF37]"><LinkedinLogo size={18} /></a>}
              {info.twitter && <a href={info.twitter} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#D4AF37]"><TwitterLogo size={18} /></a>}
              {info.youtube && <a href={info.youtube} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#D4AF37]"><YoutubeLogo size={18} /></a>}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} {info.business_name}. All rights reserved.
          </p>
          <p className="text-xs text-[#94A3B8]">
            <Link to="/login" className="hover:text-[#D4AF37]" data-testid="footer-admin-link">Admin Login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
