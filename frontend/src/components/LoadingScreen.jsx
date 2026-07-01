import React from "react";

export default function LoadingScreen() {
  return (
    <div className="loader-wrap" data-testid="loading-screen">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8a6f18] sharp gold-glow">
          <span className="font-display font-bold text-[#060B14] text-2xl">NK</span>
        </div>
        <div>
          <div className="font-display text-white text-lg">NK Prestige Steel</div>
          <div className="text-[10px] tracking-[0.24em] uppercase text-[#94A3B8]">Corporation</div>
        </div>
      </div>
      <div className="loader-bar" />
      <div className="text-xs uppercase tracking-[0.32em] text-[#94A3B8]">Forging Excellence</div>
    </div>
  );
}
