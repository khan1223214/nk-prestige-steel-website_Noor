import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircleDots, PaperPlaneRight, X, Robot } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";

function sessionId() {
  let sid = localStorage.getItem("nk_chat_sid");
  if (!sid) {
    sid = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("nk_chat_sid", sid);
  }
  return sid;
}

export default function AiChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", text: t("chat.hello") }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", { session_id: sessionId(), message: text });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: t("chat.error"), error: true }]);
    }
    setBusy(false);
  };

  const suggestions = [
    "Price of copper wire?",
    "How to book a pickup?",
    "GST invoice available?",
  ];

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed z-30 right-4 bottom-[26rem] w-12 h-12 sharp flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8a6f18] hover:from-[#F0C420] hover:to-[#D4AF37] transition-all hover:-translate-y-1 gold-glow"
        data-testid="ai-chat-toggle"
        aria-label="Open AI chat"
      >
        {open ? <X size={20} weight="bold" className="text-[#060B14]" /> : <Robot size={22} weight="bold" className="text-[#060B14]" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed z-30 right-4 bottom-[30rem] w-[92vw] max-w-sm glass-card sharp overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 34rem)" }}
            data-testid="ai-chat-panel"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0A1128] to-[#141A2E] p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Robot size={18} weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-display text-white text-sm">{t("chat.title")}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest">{t("chat.sub")}</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#060B14]" style={{ minHeight: 260 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed sharp ${
                    m.role === "user"
                      ? "bg-[#D4AF37] text-[#060B14] font-medium"
                      : m.error
                        ? "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#fca5a5]"
                        : "bg-white/5 border border-white/10 text-white"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 px-3 py-2 sharp">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] animate-pulse" style={{ animationDelay: "0.15s" }} />
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] animate-pulse" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 border-t border-white/5 bg-[#0A1128] flex gap-2 flex-wrap">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-[10px] uppercase tracking-widest px-2 py-1 border border-white/10 text-white/80 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={send} className="p-3 border-t border-white/10 bg-[#0A1128] flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="flex-1 bg-[#060B14] border border-white/10 text-white px-3 py-2 sharp text-sm focus:border-[#D4AF37] outline-none"
                data-testid="ai-chat-input"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="bg-[#D4AF37] text-[#060B14] px-3 sharp hover:bg-[#F0C420] disabled:opacity-50"
                data-testid="ai-chat-send"
              >
                <PaperPlaneRight size={16} weight="bold" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
