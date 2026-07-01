import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Lock } from "@phosphor-icons/react";

export default function Login() {
  const { admin, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back, Admin!");
      nav("/admin");
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Invalid credentials");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-10 industrial-grid" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="glass-card sharp p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#D4AF37]/20 blur-[80px]" />
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] mb-5">
              <Lock size={22} weight="duotone" />
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-2">Restricted</div>
            <h1 className="font-display text-3xl text-white mb-2">Admin Login</h1>
            <p className="text-[#94A3B8] text-sm mb-8">Sign in to manage scrap prices, gallery, services, and site content.</p>

            <form onSubmit={submit} className="space-y-4" data-testid="login-form">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none"
                  placeholder="admin@nkprestigesteel.com"
                  data-testid="login-email-input"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none"
                  placeholder="••••••••••"
                  data-testid="login-password-input"
                />
              </div>
              <button
                disabled={busy}
                className="btn-primary sharp w-full justify-center"
                data-testid="login-submit-btn"
              >
                {busy ? "Signing in…" : "Sign In"}
              </button>
            </form>
            <Link to="/forgot-password" className="mt-6 inline-block text-xs uppercase tracking-widest text-[#94A3B8] hover:text-[#D4AF37]" data-testid="forgot-link">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
