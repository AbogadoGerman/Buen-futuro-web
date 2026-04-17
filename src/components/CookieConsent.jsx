"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      const timer = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
    window.dispatchEvent(new Event("cookie_consent_granted"));
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined");
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
        padding: "20px",
      }}>
        <div style={{
          background: "rgba(27,42,74,0.98)",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "36px 40px",
          maxWidth: 560,
          width: "100%",
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
