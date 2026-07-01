import React from "react";
import Marquee from "react-fast-marquee";
import { CaretUp, CaretDown } from "@phosphor-icons/react";

/**
 * Live market price ticker. Auto-scrolls names and today's rates with trend arrows.
 */
export default function PriceTicker({ prices }) {
  if (!prices || prices.length === 0) return null;
  const items = prices.slice(0, 20);

  return (
    <div className="w-full border-y border-white/10 bg-[#0A1128]/70 backdrop-blur-md py-3" data-testid="price-ticker">
      <Marquee gradient={false} speed={38} pauseOnHover>
        {items.map((p) => {
          const diff = (p.price_per_kg || 0) - (p.previous_price || 0);
          const up = diff >= 0;
          return (
            <div key={p.id} className="flex items-center gap-2 px-8 text-sm">
              <span className="text-[#94A3B8] uppercase tracking-widest text-[10px]">{p.category}</span>
              <span className="text-white font-medium">{p.name}</span>
              <span className="text-[#D4AF37] font-semibold font-display">₹{p.price_per_kg}/kg</span>
              <span className={up ? "trend-up" : "trend-down"}>
                {up ? <CaretUp size={12} weight="fill" /> : <CaretDown size={12} weight="fill" />}
              </span>
              <span className={`text-xs ${up ? "trend-up" : "trend-down"}`}>
                {up ? "+" : ""}{diff.toFixed(2)}
              </span>
              <span className="text-white/20 px-4">|</span>
            </div>
          );
        })}
      </Marquee>
    </div>
  );
}
