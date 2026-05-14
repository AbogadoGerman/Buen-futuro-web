"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "@/app/components/ImageLightbox";

export default function ImageGallery({ imgs, titulo, descuento, tipo, showSoonPhotosTag }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  return (
    <>
      {/* Main image */}
      <div
        onClick={() => setLightboxIdx(0)}
        style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12, position: "relative", paddingTop: "56%", background: "#E8ECF0", cursor: "zoom-in" }}
      >
        <Image
          src={imgs[0]}
          alt={titulo}
          fill
          sizes="(max-width:768px) 100vw, 780px"
          priority
          style={{ objectFit: "cover" }}
          unoptimized
        />
        {descuento > 0 && (
          <div style={{ position: "absolute", top: 12, left: 12, background: "#E74C3C", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
            -{descuento}%
          </div>
        )}
        {tipo && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "#1B4F72", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {tipo}
          </div>
        )}
        {showSoonPhotosTag && (
          <div style={{ position: "absolute", top: 12, left: descuento > 0 ? 95 : 12, background: "#F39C12", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            Fotos Pronto Disponibles
          </div>
        )}
        {/* zoom hint */}
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
          {imgs.length} fotos
        </div>
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {imgs.slice(1).map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i + 1)}
              style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", flexShrink: 0, borderRadius: 8, overflow: "hidden" }}
            >
              <Image src={img} alt="" width={80} height={60} style={{ objectFit: "cover", borderRadius: 8, display: "block" }} unoptimized />
            </button>
          ))}
        </div>
      )}

      {lightboxIdx !== null && (
        <ImageLightbox imgs={imgs} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}
