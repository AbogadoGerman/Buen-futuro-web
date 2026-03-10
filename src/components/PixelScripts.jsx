"use client";

import { useEffect } from "react";

const META_PIXEL_ID = "925375136552561";
const TIKTOK_PIXEL_ID = "D6NG0U3C77U75L0FFE4G";
const TIKTOK_ACCESS_TOKEN = "021ed27c674007bb272c9491cce0d883fed397a7";

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

// --- TikTok Server-Side Events API ---
async function sendTikTokServerEvent(eventName, property, extraProps = {}) {
  try {
    const ttp = (document.cookie.match(/(?:^|;\s*)_ttp=([^;]*)/) || [])[1] || "";
    const ttclid = new URLSearchParams(window.location.search).get("ttclid") || "";
    const payload = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          page: {
            url: window.location.href,
          },
          user: {
            ip: "",
            user_agent: navigator.userAgent,
            ttp: ttp || undefined,
            ttclid: ttclid || undefined,
          },
          properties: {
            currency: "COP",
            value: parseInt(property?.precio_venta || 0, 10),
            contents: [
              {
                content_id: String(property?.nid || ""),
                content_type: "product",
                content_name: property?.titulo || "",
              },
            ],
            ...extraProps,
          },
        },
      ],
    };

    await fetch(`/api/tiktok-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload, accessToken: TIKTOK_ACCESS_TOKEN }),
    }).catch(() => {});
  } catch (_) {}
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

  // Meta: ViewContent
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

  // TikTok: ViewContent (cuando el usuario ve el catálogo / detalle de propiedad)
  if (window.ttq) {
    window.ttq.track("ViewContent", {
      contents: [
        {
          content_id: String(property.nid),
          content_type: "product",
          content_name: property.titulo,
        },
      ],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok Server-Side: ViewContent
  sendTikTokServerEvent("ViewContent", property);
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

  // TikTok: Contact (botón WhatsApp "Quiero información")
  if (window.ttq) {
    window.ttq.track("Contact", {
      contents: [
        {
          content_id: String(property.nid),
          content_type: "product",
          content_name: property.titulo,
        },
      ],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok: ClickButton (evento adicional para botones WhatsApp)
  if (window.ttq) {
    window.ttq.track("ClickButton", {
      contents: [
        {
          content_id: String(property.nid),
          content_type: "product",
          content_name: property.titulo,
        },
      ],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok Server-Side: Contact
  sendTikTokServerEvent("Contact", property);
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

  // Meta: Lead (agendar visita es un lead inmobiliario)
  if (window.fbq) {
    window.fbq("track", "Lead", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok: Lead (agendar visita)
  if (window.ttq) {
    window.ttq.track("SubmitForm", {
      contents: [
        {
          content_id: String(property.nid),
          content_type: "product",
          content_name: property.titulo,
        },
      ],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok: ClickButton (botón WhatsApp "Agendar visita")
  if (window.ttq) {
    window.ttq.track("ClickButton", {
      contents: [
        {
          content_id: String(property.nid),
          content_type: "product",
          content_name: property.titulo,
        },
      ],
      value: parseInt(property.precio_venta || 0, 10),
      currency: "COP",
    });
  }

  // TikTok Server-Side: SubmitForm (Lead)
  sendTikTokServerEvent("SubmitForm", property);
}
