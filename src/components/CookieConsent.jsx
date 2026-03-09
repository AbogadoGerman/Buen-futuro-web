"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
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
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "rgba(27,42,74,0.97)", backdropFilter: "blur(8px)",
      padding: "16px 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
      fontFamily: "'Inter',system-ui,sans-serif"
    }}>
      <p style={{ color: "white", fontSize: 13, margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
        Utilizamos cookies propias y de terceros para analizar tu navegación, personalizar contenido
        y mostrarte anuncios relevantes. Al aceptar, autorizas el uso de cookies de análisis y
        publicidad en este sitio. Y recuerda: aceptar las cookies ayudará a más personas como tú
        a encontrar un <strong>Buen Futuro</strong>.
      </p>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          onClick={decline}
          style={{
            background: "transparent", color: "#AAB7C4", border: "1px solid #AAB7C4",
            borderRadius: 8, padding: "8px 16px", fontWeight: 600,
            fontSize: 13, cursor: "pointer"
          }}
        >
          Rechazar
        </button>
        <button
          onClick={accept}
          style={{
            background: "#1B4F72", color: "white", border: "2px solid white",
            borderRadius: 8, padding: "8px 20px", fontWeight: 700,
            fontSize: 13, cursor: "pointer"
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
