"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const readConsent = () => {
      try {
        return localStorage.getItem("cookie_consent");
      } catch {
        return null;
      }
    };

    if (readConsent()) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const timer = setTimeout(() => {
      if (!readConsent()) setVisible(true);
    }, isMobile ? 1200 : 5000);

    return () => clearTimeout(timer);
  }, []);

  function accept() {
    try {
      localStorage.setItem("cookie_consent", "accepted");
    } catch {
      // Ignora errores de almacenamiento en navegadores restringidos.
    }
    setVisible(false);
    window.dispatchEvent(new Event("cookie_consent_granted"));
  }

  function decline() {
    try {
      localStorage.setItem("cookie_consent", "declined");
    } catch {
      // Ignora errores de almacenamiento en navegadores restringidos.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay semitransparente que bloquea toda la pantalla */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(3px)",
      }} />

      {/* Modal de cookies centrado */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
        overflowY: "auto",
      }}>
        <div style={{
          background: "rgba(27,42,74,0.98)",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "clamp(18px, 5vw, 36px) clamp(16px, 4vw, 40px)",
          maxWidth: 560,
          width: "100%",
          maxHeight: "calc(100dvh - 24px)",
          overflowY: "auto",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
          fontFamily: "'Inter',system-ui,sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
          {/* Encabezado con icono de galletas */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 48, lineHeight: 1 }}>🍪</span>
            <h2 style={{
              color: "white", margin: 0,
              fontSize: 22, fontWeight: 700, lineHeight: 1.2,
            }}>
              Política de Cookies
            </h2>
          </div>

          {/* Texto informativo */}
          <p style={{
            color: "#CBD5E1", fontSize: 15, margin: 0, lineHeight: 1.7,
          }}>
            Utilizamos cookies propias y de terceros para analizar tu navegación,
            personalizar contenido y mostrarte anuncios relevantes. Al aceptar,
            autorizas el uso de cookies de análisis y publicidad en este sitio.
            Y recuerda: aceptar las cookies ayudará a más personas como tú a
            encontrar un <strong style={{ color: "white" }}>Buen Futuro</strong>.
          </p>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={decline}
              style={{
                background: "transparent", color: "#AAB7C4",
                border: "1px solid #AAB7C4", borderRadius: 10,
                padding: "12px 24px", fontWeight: 600,
                fontSize: 15, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.target.style.background = "rgba(170,183,196,0.15)"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; }}
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              style={{
                background: "#1B4F72", color: "white",
                border: "2px solid white", borderRadius: 10,
                padding: "12px 28px", fontWeight: 700,
                fontSize: 15, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.target.style.background = "#2471A3"; }}
              onMouseLeave={e => { e.target.style.background = "#1B4F72"; }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
