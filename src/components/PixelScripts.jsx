"use client";

import { useEffect } from "react";

const META_PIXEL_ID = "925375136552561";
const TIKTOK_PIXEL_ID = "D6NG0U3C77U75L0FFE4G";
const TIKTOK_ACCESS_TOKEN = "021ed27c674007bb272c9491cce0d883fed397a7";

function hasConsent() {
  return typeof window !== "undefined" && localStorage.getItem("cookie_consent") === "accepted";
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

// --- Helper: construye contenido estandarizado para eventos TikTok ---
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
// ============================================================

// ViewContent — Botón catálogo / ver propiedad
export function trackViewContent(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      content_category: property.tipo || "Inmueble",
      value: buildValue(property),
      currency: "COP",
      city: property.ciudad || "",
      neighborhood: property.barrio || "",
    });
  }
  if (window.ttq) {
    window.ttq.track("ViewContent", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("ViewContent", property);
}

// Contact + ClickButton — Botón WhatsApp "Quiero información"
export function trackContact(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "Contact", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Contact", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
    window.ttq.track("ClickButton", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("Contact", property);
}

// Lead + Schedule + ClickButton — Botón WhatsApp "Agendar visita"
export function trackSchedule(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "Schedule", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
    window.fbq("track", "Lead", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("SubmitForm", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
    window.ttq.track("ClickButton", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
    window.ttq.track("Schedule", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("SubmitForm", property);
}

// Lead — Envío de formulario / solicitud de información
export function trackLead(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "Lead", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Plomo", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("Lead", property);
}

// Search — Búsqueda de propiedades
export function trackSearch(property, searchKeywords = "") {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "Search", {
      content_type: "product",
      search_string: searchKeywords,
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Buscar", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
      search_string: searchKeywords,
    });
  }
  sendTikTokServerEvent("Search", property, { search_string: searchKeywords });
}

// Subscribe — Suscripción / notificaciones
export function trackSubscribe(property) {
  if (!hasConsent()) return;
  if (window.ttq) {
    window.ttq.track("Suscribirse", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("Subscribe", property);
}

// FindLocation — Buscar ubicación en mapa
export function trackFindLocation(property) {
  if (!hasConsent()) return;
  if (window.ttq) {
    window.ttq.track("BuscarUbicación", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("FindLocation", property);
}

// Download — Descargar brochure / ficha técnica
export function trackDownload(property) {
  if (!hasConsent()) return;
  if (window.ttq) {
    window.ttq.track("Descargar", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("Download", property);
}

// SubmitApplication — Enviar solicitud / formulario
export function trackSubmitApplication(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "SubmitApplication", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Enviar solicitud", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("SubmitApplication", property);
}

// CompleteRegistration — Registro completado
export function trackCompleteRegistration(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "CompleteRegistration", {
      content_name: property.titulo,
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("RegistroCompletado", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("CompleteRegistration", property);
}

// InitiateCheckout — Inicio de proceso de contacto/cierre
export function trackInitiateCheckout(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Iniciar el pago", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("InitiateCheckout", property);
}

// Purchase — Negocio cerrado
export function trackPurchase(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Compra", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("Purchase", property);
}

// AddToWishlist — Guardar propiedad favorita
export function trackAddToWishlist(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "AddToWishlist", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Añadir a la lista de deseos", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("AddToWishlist", property);
}

// AddToCart — Agregar al carrito / seleccionar propiedad
export function trackAddToCart(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "AddToCart", {
      content_name: property.titulo,
      content_ids: [property.nid],
      content_type: "product",
      value: buildValue(property),
      currency: "COP",
    });
  }
  if (window.ttq) {
    window.ttq.track("Añadir al carrito", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("AddToCart", property);
}

// PageView — Vista de página personalizada
export function trackPageView(property) {
  if (!hasConsent()) return;
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
  if (window.ttq) {
    window.ttq.track("Página vista", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("PageView", property);
}

// AppointmentScheduled — Prueba / cita agendada
export function trackStartTrial(property) {
  if (!hasConsent()) return;
  if (window.ttq) {
    window.ttq.track("Iniciar prueba", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("StartTrial", property);
}

// ApplicationApproval — Aprobación de solicitud
export function trackApplicationApproval(property) {
  if (!hasConsent()) return;
  if (window.ttq) {
    window.ttq.track("Aprobación de la aplicación", {
      contents: buildContents(property),
      value: buildValue(property),
      currency: "COP",
    });
  }
  sendTikTokServerEvent("ApplicationApproval", property);
}
