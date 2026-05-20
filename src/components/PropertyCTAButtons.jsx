"use client";

import { useEffect, useState, useRef } from "react";
import { trackViewContent, trackContact, trackSchedule } from "./PixelScripts";

const WA = "573108074915";

function sendServerEvent(p, eventName) {
  const fbp = (document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/) || [])[1] || "";
  const fbc = (document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/) || [])[1] || "";
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nid: p.nid,
      titulo: p.titulo || "",
      ubicacion: [p.barrio, p.conjunto, p.ciudad].filter(Boolean).join(", "),
      precio: p.precioFormateado || "",
      area: p.area || "N/A",
      habitaciones: p.habitaciones || "N/A",
      banos: p.banos || "N/A",
      bonoHabi: "",
      eventName,
      sourceUrl: window.location.href,
      fbp,
      fbc,
    }),
  }).catch(() => {});
}

export default function PropertyCTAButtons({ property }) {
  const p = property;

  const waMsg = encodeURIComponent(
    `Hola, estoy interesado(a) en el inmueble:\n\n\u{1F4CB} NID: ${p.nid}\n\u{1F3E1} Inmueble: ${p.titulo}\n\u{1F4CD} Ubicaci\u00f3n: ${[p.barrio, p.conjunto, p.ciudad].filter(Boolean).join(", ")}\n\u{1F4B0} Precio: ${p.precioFormateado}\n\n\u00bfMe podr\u00edan dar m\u00e1s informaci\u00f3n?`
  );

  const waScheduleMsg = encodeURIComponent(
    `Hola, quiero agendar una visita para el inmueble:\n\n\u{1F4CB} NID: ${p.nid}\n\u{1F3E1} ${p.titulo}\n\u{1F4CD} ${[p.barrio, p.ciudad].filter(Boolean).join(", ")}`
  );

  useEffect(() => {
    trackViewContent(p);
  }, [p]);

  function handleInfo() {
    trackContact(p);
    sendServerEvent(p, "Contact");
    window.open(`https://wa.me/${WA}?text=${waMsg}`, "_blank");
  }

  // Agendar visita: dispara PlaceAnOrder + Schedule + Lead + ClickButton
  // PlaceAnOrder es necesario para que TikTok habilite el enlace de producto en anuncios
  function handleSchedule() {
    trackSchedule(p);        // incluye PlaceAnOrder, SubmitForm, ClickButton, Schedule
    sendServerEvent(p, "PlaceAnOrder");
    sendServerEvent(p, "Schedule");
    window.open(`https://wa.me/${WA}?text=${waScheduleMsg}`, "_blank");
  }

  // Compartir
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function handleShareClick() {
    try {
      const shareData = {
        title: p.titulo || "Inmueble",
        text: `${p.titulo || "Inmueble"} - ${[p.barrio, p.ciudad].filter(Boolean).join(", ")}`,
        url: window.location.href,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        sendServerEvent(p, "Share");
        return;
      }
    } catch (e) {
      // ignore and fallback
    }
    setShareOpen((v) => !v);
  }

  function openShareUrl(url) {
    sendServerEvent(p, "Share");
    window.open(url, "_blank");
    setShareOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sendServerEvent(p, "Share");
    } catch (e) {
      // ignore
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={handleInfo}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: "linear-gradient(135deg,#1B4F72,#1B2A4A)", color: "white",
          borderRadius: 14, padding: "15px 20px", fontWeight: 800, fontSize: 16,
          textDecoration: "none", border: "none", cursor: "pointer"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Quiero información
      </button>
      <button
        onClick={handleSchedule}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: "white", color: "#1B4F72", borderRadius: 14,
          padding: "14px 20px", fontWeight: 700, fontSize: 15,
          textDecoration: "none", border: "2px solid #1B4F72", cursor: "pointer"
        }}
      >
        {"\u{1F4C5}"} Agendar visita
      </button>
      <div style={{ position: "relative" }} ref={shareRef}>
        <button
          onClick={handleShareClick}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#f5f7fa", color: "#1B2A4A", borderRadius: 14,
            padding: "12px 16px", fontWeight: 700, fontSize: 15,
            textDecoration: "none", border: "2px solid #e0e6eb", cursor: "pointer"
          }}
        >
          {"\u{1F4E4}"} Compartir
        </button>

        {shareOpen && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            background: "white", border: "1px solid #e6edf3", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(17,24,39,0.08)", padding: 10, zIndex: 40,
            display: "flex", flexDirection: "column", gap: 8, minWidth: 220
          }}>
            <button onClick={() => openShareUrl(`https://wa.me/?text=${encodeURIComponent(p.titulo + ' ' + window.location.href)}`)} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>WhatsApp</button>
            <button onClick={() => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>Facebook</button>
            <button onClick={() => openShareUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(p.titulo || '')}&url=${encodeURIComponent(window.location.href)}`)} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>Twitter</button>
            <button onClick={() => openShareUrl(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`)} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>LinkedIn</button>
            <button onClick={() => openShareUrl(`mailto:?subject=${encodeURIComponent(p.titulo || 'Inmueble')}&body=${encodeURIComponent(window.location.href)}`)} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>Email</button>
            <button onClick={copyLink} style={{padding:8, textAlign:"left", borderRadius:8, border:"none", background:"#fff", cursor:"pointer"}}>{copied ? 'Enlace copiado' : 'Copiar enlace'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
