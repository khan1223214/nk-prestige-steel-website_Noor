import { useEffect } from "react";

/**
 * Injects Google Analytics gtag.js if a valid GA4 measurement ID is set on business info.
 * Also injects a Google Search Console verification meta tag if provided.
 */
export function useAnalytics(info) {
  useEffect(() => {
    if (!info) return;

    // Google Analytics
    const gaId = (info.google_analytics_id || "").trim();
    if (gaId && /^G-[A-Z0-9]+$/i.test(gaId) && !window.__ga_loaded) {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}');`;
      document.head.appendChild(s2);
      window.__ga_loaded = true;
    }

    // Google Search Console verification
    const verify = (info.google_search_console_verification || "").trim();
    if (verify && !document.querySelector('meta[name="google-site-verification"]')) {
      const m = document.createElement("meta");
      m.name = "google-site-verification";
      m.content = verify;
      document.head.appendChild(m);
    }

    // SEO keywords (dynamic)
    const kw = (info.seo_keywords || "").trim();
    if (kw) {
      let el = document.querySelector('meta[name="keywords"]');
      if (!el) {
        el = document.createElement("meta");
        el.name = "keywords";
        document.head.appendChild(el);
      }
      el.content = kw;
    }

    // Favicon (dynamic override)
    const fav = (info.favicon_url || "").trim();
    if (fav) {
      const href = fav.startsWith("http") ? fav : `${process.env.REACT_APP_BACKEND_URL}/api/files/${fav}`;
      let el = document.querySelector('link[rel="icon"]');
      if (!el) {
        el = document.createElement("link");
        el.rel = "icon";
        document.head.appendChild(el);
      }
      el.href = href;
    }
  }, [info]);
}
