import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import { EnvelopeSimple, ArrowLeft } from "@phosphor-icons/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.debug_link) setDevLink(data.debug_link);
      toast.success("Check your email for a reset link.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Request failed");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-10 industrial-grid" data-testid="forgot-page">
      <div className="w-full max-w-md">
        <div className="glass-card sharp p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#D4AF37]/20 blur-[80px]" />
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] mb-5">
              <EnvelopeSimple size={22} weight="duotone" />
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-2">Password Recovery</div>
            <h1 className="font-display text-3xl text-white mb-2">Forgot Password?</h1>
            <p className="text-[#94A3B8] text-sm mb-8">
              Enter your admin email and we'll send a reset link. The reset link is valid for 1 hour.
            </p>

            {!sent ? (
              <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none"
                    data-testid="forgot-email-input"
                  />
                </div>
                <button disabled={busy} className="btn-primary sharp w-full justify-center" data-testid="forgot-submit-btn">
                  {busy ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="glass-card sharp p-4 border border-[#D4AF37]/30" data-testid="forgot-success">
                  <p className="text-sm text-white">
                    If the email exists in our records, a reset link has been sent. Check your inbox (and spam folder).
                  </p>
                </div>
                {devLink && (
                  <div className="p-4 border border-[#D4AF37]/50 bg-[#D4AF37]/5" data-testid="forgot-dev-link">
                    <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-2">Dev Reset Link</div>
                    <p className="text-xs text-[#94A3B8] mb-3">
                      Email delivery isn't configured. Use this link to reset now:
                    </p>
                    <a href={devLink} className="text-[#D4AF37] hover:text-[#F0C420] break-all text-xs underline">
                      {devLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#94A3B8] hover:text-[#D4AF37]" data-testid="back-to-login">
              <ArrowLeft size={12} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
