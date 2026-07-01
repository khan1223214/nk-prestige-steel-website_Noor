import React, { createContext, useContext, useEffect, useState } from "react";

const DICT = {
  en: {
    "nav.home": "Home",
    "nav.prices": "Live Prices",
    "nav.services": "Services",
    "nav.gallery": "Gallery",
    "nav.pickup": "Request Pickup",
    "nav.contact": "Contact",
    "nav.quote": "Get Quote",
    "hero.badge": "GST Certified · Est. Karnataka",
    "hero.title1": "Karnataka's Premium",
    "hero.title2": "Scrap Dealer",
    "hero.title3": "",
    "hero.subtitle": "We Buy All Types of Scrap at the Best Market Price. Instant quotes, doorstep pickup, and same-day payment.",
    "btn.call": "Call Owner",
    "btn.whatsapp": "WhatsApp",
    "btn.quote": "Get Quote",
    "btn.prices": "Today's Prices",
    "btn.gallery": "Gallery",
    "btn.pickup": "Request Pickup",
    "btn.directions": "Directions",
    "stats.tonnes": "Tonnes Recycled",
    "stats.clients": "Happy Clients",
    "stats.years": "Years Experience",
    "stats.locations": "Pickup Locations",
    "sec.livemarket": "Live Market",
    "sec.todayprices": "Today's Scrap Prices",
    "sec.viewfull": "View Full Price List",
    "sec.whatwebuy": "What We Buy",
    "sec.services": "Complete Scrap Services",
    "sec.allservices": "All Services",
    "sec.fieldops": "Field Operations",
    "sec.ourwork": "Our Work in Action",
    "sec.fullgallery": "Full Gallery",
    "sec.trusted": "Trusted by 400+ Clients",
    "sec.testimonials": "What Our Clients Say",
    "sec.faq": "Frequently Asked",
    "sec.cta.title": "Have scrap to sell?",
    "sec.cta.sub": "Get an instant quote or schedule a free pickup today.",
    "chat.title": "Instant Quote AI",
    "chat.sub": "Ask about prices, pickup, or scrap types",
    "chat.placeholder": "Type your question…",
    "chat.send": "Send",
    "chat.hello": "Hi! I'm the NK Prestige Steel assistant. Ask me about scrap prices, pickup, or get an instant quote!",
    "chat.error": "Assistant is unavailable right now. Please call or WhatsApp us directly.",
    "lang.switch": "ಕನ್ನಡ",
  },
  kn: {
    "nav.home": "ಮುಖಪುಟ",
    "nav.prices": "ಇಂದಿನ ದರಗಳು",
    "nav.services": "ಸೇವೆಗಳು",
    "nav.gallery": "ಗ್ಯಾಲರಿ",
    "nav.pickup": "ಪಿಕಪ್ ವಿನಂತಿ",
    "nav.contact": "ಸಂಪರ್ಕ",
    "nav.quote": "ಬೆಲೆ ಕೇಳಿ",
    "hero.badge": "GST ಪ್ರಮಾಣಿತ · ಕರ್ನಾಟಕ",
    "hero.title1": "ಕರ್ನಾಟಕದ ಪ್ರೀಮಿಯಂ",
    "hero.title2": "ಸ್ಕ್ರ್ಯಾಪ್ ಡೀಲರ್",
    "hero.title3": "",
    "hero.subtitle": "ಎಲ್ಲಾ ರೀತಿಯ ಸ್ಕ್ರ್ಯಾಪ್ ಅನ್ನು ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗೆ ಖರೀದಿಸುತ್ತೇವೆ. ತಕ್ಷಣದ ಬೆಲೆ, ಮನೆ ಬಾಗಿಲಿಗೆ ಪಿಕಪ್ ಮತ್ತು ಅದೇ ದಿನದ ಪಾವತಿ.",
    "btn.call": "ಮಾಲೀಕರಿಗೆ ಕರೆ",
    "btn.whatsapp": "ವಾಟ್ಸಪ್",
    "btn.quote": "ಬೆಲೆ ಕೇಳಿ",
    "btn.prices": "ಇಂದಿನ ದರಗಳು",
    "btn.gallery": "ಗ್ಯಾಲರಿ",
    "btn.pickup": "ಪಿಕಪ್ ವಿನಂತಿ",
    "btn.directions": "ಮಾರ್ಗ",
    "stats.tonnes": "ಟನ್ ಮರುಬಳಕೆ",
    "stats.clients": "ಸಂತೋಷಿತ ಗ್ರಾಹಕರು",
    "stats.years": "ವರ್ಷಗಳ ಅನುಭವ",
    "stats.locations": "ಪಿಕಪ್ ಸ್ಥಳಗಳು",
    "sec.livemarket": "ಲೈವ್ ಮಾರುಕಟ್ಟೆ",
    "sec.todayprices": "ಇಂದಿನ ಸ್ಕ್ರ್ಯಾಪ್ ದರಗಳು",
    "sec.viewfull": "ಪೂರ್ಣ ದರ ಪಟ್ಟಿ ನೋಡಿ",
    "sec.whatwebuy": "ನಾವು ಏನನ್ನು ಖರೀದಿಸುತ್ತೇವೆ",
    "sec.services": "ಸಂಪೂರ್ಣ ಸ್ಕ್ರ್ಯಾಪ್ ಸೇವೆಗಳು",
    "sec.allservices": "ಎಲ್ಲಾ ಸೇವೆಗಳು",
    "sec.fieldops": "ಕ್ಷೇತ್ರ ಕಾರ್ಯಗಳು",
    "sec.ourwork": "ನಮ್ಮ ಕೆಲಸ",
    "sec.fullgallery": "ಪೂರ್ಣ ಗ್ಯಾಲರಿ",
    "sec.trusted": "400+ ಗ್ರಾಹಕರಿಂದ ವಿಶ್ವಾಸಿತ",
    "sec.testimonials": "ನಮ್ಮ ಗ್ರಾಹಕರು ಏನು ಹೇಳುತ್ತಾರೆ",
    "sec.faq": "ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು",
    "sec.cta.title": "ಸ್ಕ್ರ್ಯಾಪ್ ಮಾರಾಟ ಮಾಡುವುದೇ?",
    "sec.cta.sub": "ತಕ್ಷಣದ ಬೆಲೆ ಪಡೆಯಿರಿ ಅಥವಾ ಇಂದೇ ಉಚಿತ ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ.",
    "chat.title": "ತಕ್ಷಣದ ಬೆಲೆ AI",
    "chat.sub": "ಬೆಲೆ, ಪಿಕಪ್ ಅಥವಾ ಸ್ಕ್ರ್ಯಾಪ್ ವಿಧಗಳ ಬಗ್ಗೆ ಕೇಳಿ",
    "chat.placeholder": "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ…",
    "chat.send": "ಕಳುಹಿಸಿ",
    "chat.hello": "ನಮಸ್ಕಾರ! ನಾನು NK Prestige Steel ಸಹಾಯಕ. ಸ್ಕ್ರ್ಯಾಪ್ ಬೆಲೆ, ಪಿಕಪ್ ಅಥವಾ ತಕ್ಷಣದ ಬೆಲೆ ಕೇಳಿ!",
    "chat.error": "ಸಹಾಯಕ ಸದ್ಯ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕರೆ ಅಥವಾ ವಾಟ್ಸಪ್ ಮಾಡಿ.",
    "lang.switch": "English",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("nk_lang") || "en");

  useEffect(() => {
    localStorage.setItem("nk_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => {
    const val = DICT[lang]?.[key];
    if (val !== undefined) return val;
    const fallback = DICT.en[key];
    return fallback !== undefined ? fallback : key;
  };
  const toggle = () => setLang((l) => (l === "en" ? "kn" : "en"));

  return <I18nContext.Provider value={{ lang, setLang, toggle, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
