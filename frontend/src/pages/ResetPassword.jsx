import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Key } from "@phosphor-icons/react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success("Password reset. You can now log in with your new password.");
      nav("/login");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Reset failed");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-10 industrial-grid" data-testid="reset-page">
      <div className="w-full max-w-md">
        <div className="glass-card sharp p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#D4AF37]/20 blur-[80px]" />
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] mb-5">
              <Key size={22} weight="duotone" />
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-2">Set a New Password</div>
            <h1 className="font-display text-3xl text-white mb-2">Reset Password</h1>
            <p className="text-[#94A3B8] text-sm mb-8">Choose a strong password (minimum 8 characters).</p>

            {!token && (
              <div className="p-4 border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#fca5a5] text-sm mb-4">
                Missing reset token. Please use the link from your email.
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none"
                  data-testid="reset-password-input"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-[#060B14] border border-white/10 text-white px-4 py-3 sharp focus:border-[#D4AF37] outline-none"
                  data-testid="reset-confirm-input"
                />
              </div>
              <button disabled={busy || !token} className="btn-primary sharp w-full justify-center" data-testid="reset-submit-btn">
                {busy ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <Link to="/login" className="mt-6 inline-block text-xs uppercase tracking-widest text-[#94A3B8] hover:text-[#D4AF37]">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
