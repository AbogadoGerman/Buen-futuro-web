"use client";

import { useEffect } from "react";
import Script from "next/script";

const META_PIXEL_ID = "925375136552561";
const TIKTOK_PIXEL_ID = "D6NG0U3C77U75L0FFE4G";

function hasConsent() {
  return typeof window !== "undefined" && localStorage.getItem("cookie_consent") === "accepted";
}

function initPixels() {
  // Meta Pixel
  if (!window.fbq) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  // TikTok Pixel
  if (!window.ttq) {
    (function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function (e, n) {
        var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var s = document.createElement("script");
        s.type = "text/javascript"; s.async = !0; s.src = r + "?sdkid=" + e + "&lib=" + t;
        var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(s, a);
      };
      ttq.load(TIKTOK_PIXEL_ID);
      ttq.page();
    })(window, document, "ttq");
  }
}

export default function PixelScripts() {
  useEffect(() => {
    if (hasConsent()) {
      initPixels();
    }

    function onConsent() {
      initPixels();
    }

    window.addEventListener("cookie_consent_granted", onConsent);
    return () => window.removeEventListener("cookie_consent_granted", onConsent);
  }, []);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

// --- Tracking helper functions ---

export function trackViewContent(property) {
  if (!hasConsent()) return;
  // Meta: ViewContent (for retargeting audiences)
  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      content_category: property.tipo || "Inmueble",
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
      city: property.ciudad || "",
      neighborhood: property.barrio || "",
    });
  }
}

export function trackContact(property) {
  if (!hasConsent()) return;
  // Meta: Contact
  if (window.fbq) {
    window.fbq("track", "Contact", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }
  // TikTok: ClickButton
  if (window.ttq) {
    window.ttq.track("ClickButton", {
      contents: [{ content_id: property.nid, content_name: property.titulo }],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }
}

export function trackSchedule(property) {
  if (!hasConsent()) return;
  // Meta: Schedule
  if (window.fbq) {
    window.fbq("track", "Schedule", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }
  // TikTok: SubmitForm
  if (window.ttq) {
    window.ttq.track("SubmitForm", {
      contents: [{ content_id: property.nid, content_name: property.titulo }],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }
}
