"use client";

import { useEffect } from "react";

const META_PIXEL_ID = "925375136552561";
const TIKTOK_PIXEL_ID = "D6NG0U3C77U75L0FFE4G";
const TIKTOK_ACCESS_TOKEN = "021ed27c674007bb272c9491cce0d883fed397a7";

function hasConsent() {
  return typeof window !== "undefined" && localStorage.getItem("cookie_consent") === "accepted";
}

// Genera un event_id único compartido entre navegador y servidor para deduplicación
function generateEventId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// --- SHA-256 helper (para ttq.identify) ---
async function sha256(str) {
  if (!str) return undefined;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- ttq.identify con datos del usuario hasheados ---
export async function identifyUser({ email, phone, externalId } = {}) {
  if (!window.ttq) return;
  const [hashedEmail, hashedPhone, hashedId] = await Promise.all([
    sha256(email),
    sha256(phone),
    sha256(externalId),
  ]);
  window.ttq.identify({
    email: hashedEmail,
    phone_number: hashedPhone,
    external_id: hashedId,
  });
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

// --- Helpers ---
function buildContents(property) {
  return [
    {
      content_id: String(property?.nid || ""),
      content_type: "product",
      content_name: property?.titulo || "",
    },
  ];
}

function buildValue(property) {
  return parseInt(property?.precio_venta || 0, 10);
}

// --- TikTok Server-Side Events API ---
// event_id se comparte con el navegador para deduplicación correcta
async function sendTikTokServerEvent(eventName, property, eventId, extraProps = {}) {
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
          event_id: eventId, // mismo ID que el navegador para deduplicar
          page: { url: window.location.href },
          user: {
            user_agent: navigator.userAgent,
            ttp: ttp || undefined,
            ttclid: ttclid || undefined,
          },
          properties: {
            currency: "COP",
            value: buildValue(property),
            contents: buildContents(property),
            ...extraProps,
          },
        },
      ],
    };
    await fetch("/api/tiktok-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, accessToken: TIKTOK_ACCESS_TOKEN }),
    }).catch(() => {});
  } catch (_) {}
}

export default function PixelScripts() {
  useEffect(() => {
    if (hasConsent()) initPixels();
    function onConsent() { initPixels(); }
    window.addEventListener("cookie_consent_granted", onConsent);
    return () => window.removeEventListener("cookie_consent_granted", onConsent);
  }, []);

  return (
    <noscript>
      <img
        height="1" width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

// ============================================================
// TRACKING FUNCTIONS
// Cada función genera un event_id único compartido entre
// el píxel del navegador (ttq.track) y el servidor (API)
// para que TikTok pueda deduplicar correctamente.
// ============================================================

// ViewContent — Ver propiedad en catálogo
export function trackViewContent(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      content_category: property.tipo || "Inmueble",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("ViewContent", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("ViewContent", property, eventId);
}

// Contact + ClickButton — WhatsApp "Quiero información"
export function trackContact(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "Contact", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("Contact", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
    window.ttq.track("ClickButton", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: generateEventId() });
  }
  sendTikTokServerEvent("Contact", property, eventId);
}

// PlaceAnOrder + CompleteRegistration + SubmitForm + ClickButton + Schedule
// — Botón "Agendar visita" → habilita enlace de producto en TikTok Ads
export function trackSchedule(property) {
  if (!hasConsent()) return;

  const idPlaceAnOrder = generateEventId();
  const idCompleteReg  = generateEventId();
  const idSubmitForm   = generateEventId();
  const idClickButton  = generateEventId();
  const idSchedule     = generateEventId();

  if (window.fbq) {
    window.fbq("track", "Schedule", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: idSchedule });
    window.fbq("track", "Lead", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: generateEventId() });
  }

  if (window.ttq) {
    // PlaceAnOrder: requerido para enlace de producto TikTok
    window.ttq.track("PlaceAnOrder", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: idPlaceAnOrder });

    // CompleteRegistration: confirma conversión para TikTok Ads
    window.ttq.track("CompleteRegistration", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: idCompleteReg });

    window.ttq.track("SubmitForm", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: idSubmitForm });

    window.ttq.track("ClickButton", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: idClickButton });

    window.ttq.track("Schedule", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: idSchedule });
  }

  // Server-side con el mismo event_id del navegador
  sendTikTokServerEvent("PlaceAnOrder",          property, idPlaceAnOrder);
  sendTikTokServerEvent("CompleteRegistration",  property, idCompleteReg);
  sendTikTokServerEvent("SubmitForm",            property, idSubmitForm);
}

// PlaceAnOrder standalone
export function trackPlaceAnOrder(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("PlaceAnOrder", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("PlaceAnOrder", property, eventId);
}

// Purchase — Negocio cerrado
export function trackPurchase(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("Purchase", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("Purchase", property, eventId);
}

// Lead — Formulario de captación
export function trackLead(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "Lead", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("Lead", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("Lead", property, eventId);
}

// Search — Búsqueda de propiedades
export function trackSearch(property, searchKeywords = "") {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "Search", {
      content_type: "product",
      search_string: searchKeywords,
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("Search", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
      search_string: searchKeywords,
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("Search", property, eventId, { search_string: searchKeywords });
}

// AddToWishlist — Guardar propiedad favorita
export function trackAddToWishlist(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "AddToWishlist", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("AddToWishlist", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("AddToWishlist", property, eventId);
}

// AddToCart — Seleccionar propiedad
export function trackAddToCart(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "AddToCart", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("AddToCart", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("AddToCart", property, eventId);
}

// AddPaymentInfo — Información de pago
export function trackAddPaymentInfo(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("AddPaymentInfo", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("AddPaymentInfo", property, eventId);
}

// InitiateCheckout — Inicio proceso de cierre
export function trackInitiateCheckout(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("InitiateCheckout", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("InitiateCheckout", property, eventId);
}

// CompleteRegistration — Registro completado
export function trackCompleteRegistration(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "CompleteRegistration", {
      content_name: property.titulo,
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("CompleteRegistration", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("CompleteRegistration", property, eventId);
}

// Subscribe — Suscripción / notificaciones
export function trackSubscribe(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("Subscribe", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("Subscribe", property, eventId);
}

// FindLocation — Mapa / ubicación
export function trackFindLocation(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("FindLocation", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("FindLocation", property, eventId);
}

// Download — Ficha técnica / brochure
export function trackDownload(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("Download", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("Download", property, eventId);
}

// SubmitApplication — Enviar solicitud
export function trackSubmitApplication(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "SubmitApplication", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    }, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("SubmitForm", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("SubmitForm", property, eventId);
}

// PageView — Vista de página personalizada
export function trackPageView(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.fbq) {
    window.fbq("track", "PageView", {}, { eventID: eventId });
  }
  if (window.ttq) {
    window.ttq.track("ViewContent", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("ViewContent", property, eventId);
}

// StartTrial — Cita agendada
export function trackStartTrial(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("StartTrial", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("StartTrial", property, eventId);
}

// ApplicationApproval — Aprobación de solicitud
export function trackApplicationApproval(property) {
  if (!hasConsent()) return;
  const eventId = generateEventId();
  if (window.ttq) {
    window.ttq.track("ApplicationApproval", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    }, { event_id: eventId });
  }
  sendTikTokServerEvent("ApplicationApproval", property, eventId);
}
