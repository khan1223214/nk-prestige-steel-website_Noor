import React, { useEffect, useState } from "react";
import { api, BACKEND_URL } from "../lib/api";
import { motion } from "framer-motion";
import { CurrencyInr, Bank, Wallet, Receipt, ArrowSquareOut } from "@phosphor-icons/react";
import Seo from "../components/Seo";

const KIND_META = {
  UPI: { icon: <CurrencyInr size={22} weight="duotone" />, color: "#22C55E" },
  BANK: { icon: <Bank size={22} weight="duotone" />, color: "#3B82F6" },
  NEFT: { icon: <Bank size={22} weight="duotone" />, color: "#6366F1" },
  RTGS: { icon: <Bank size={22} weight="duotone" />, color: "#8B5CF6" },
  CASH: { icon: <Wallet size={22} weight="duotone" />, color: "#F59E0B" },
  CHEQUE: { icon: <Receipt size={22} weight="duotone" />, color: "#EC4899" },
  OTHER: { icon: <Wallet size={22} weight="duotone" />, color: "#94A3B8" },
};

export default function Payments() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/payment-methods?only_enabled=true").then((r) => {
      setMethods(r.data);
      setLoading(false);
    });
  }, []);

  const qrOf = (m) => {
    if (!m.qr_image_url) return null;
    return m.qr_image_url.startsWith("http") ? m.qr_image_url : `${BACKEND_URL}/api/files/${m.qr_image_url}`;
  };

  return (
    <div className="pt-24 pb-20" data-testid="payments-page">
      <Seo title="Payment Methods — NK Prestige Steel Corporation" description="UPI, bank transfer, cash, cheque, NEFT and RTGS payment options for scrap sellers. Instant payment after weighing." path="/payments" />
      <div className="section-container">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] mb-3">Instant Settlement</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Payment Methods</h1>
          <p className="text-[#94A3B8] mt-4 max-w-2xl">
            We settle scrap payments the same day. Choose any of the following — cash on the spot for small pickups, or bank/UPI for larger lots.
          </p>
        </div>

        {loading && <p className="text-[#94A3B8]">Loading…</p>}
        {!loading && methods.length === 0 && (
          <div className="glass-card sharp p-16 text-center">
            <p className="text-[#94A3B8]">No payment methods configured yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map((m, i) => {
            const meta = KIND_META[m.kind] || KIND_META.OTHER;
            const qr = qrOf(m);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="glass-card sharp p-6 hover-lift"
                data-testid={`payment-method-${m.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex items-center justify-center border sharp shrink-0" style={{ color: meta.color, borderColor: `${meta.color}55` }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: meta.color }}>{m.kind}</div>
                    <h3 className="font-display text-white text-lg leading-tight">{m.label}</h3>
                    {m.details && (
                      <pre className="text-[#94A3B8] text-sm leading-relaxed mt-3 whitespace-pre-wrap font-body">{m.details}</pre>
                    )}
                    {qr && (
                      <div className="mt-4 inline-block p-2 bg-white sharp">
                        <img src={qr} alt="QR code" className="w-40 h-40 object-contain" loading="lazy" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="glass-card sharp p-6 mt-10 border-l-2 border-[#D4AF37]">
          <p className="text-sm text-[#94A3B8]">
            <span className="text-[#D4AF37] font-semibold">GST invoicing:</span> available for corporate buyers. Please share your GSTIN and PO before pickup for compliant invoicing.
          </p>
        </div>
      </div>
    </div>
  );
}
