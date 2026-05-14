import { INV } from "@/data/properties";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PropertyCTAButtons from "@/components/PropertyCTAButtons";
import ImageGalleryWithLightbox from "@/components/ImageGalleryWithLightbox";

const WA = "573108074915";

function fmt(p) {
  const n = parseInt(p || 0, 10);
  if (!n) return "Consultar";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export async function generateStaticParams() {
  return INV.map((p) => ({ nid: p.nid }));
}

export async function generateMetadata({ params }) {
  const { nid } = await params;
  const p = INV.find((x) => x.nid === nid);
  if (!p) return { title: "Inmueble no encontrado" };
  return {
    title: p.titulo + " | Inmobiliaria Buen Futuro",
    description: p.descripcion
      ? p.descripcion.slice(0, 160)
      : `${p.tipo} en venta en ${p.barrio}, ${p.ciudad}. Precio: ${fmt(p.precio_venta)}.`,
    openGraph: {
      title: p.titulo,
      description: p.descripcion ? p.descripcion.slice(0, 160) : "",
      images: p.images && p.images[0] ? [{ url: p.images[0] }] : [],
    },
  };
}

function hasRealImages(images) {
  if (!images || images.length === 0) return false;
  return images.some(
    (img) =>
      img &&
      img.startsWith("http") &&
      !img.includes("unsplash.com") &&
      !img.endsWith(".svg")
  );
}

export default async function PropertyPage({ params }) {
  const { nid } = await params;
  const p = INV.find((x) => x.nid === nid);
  if (!p) notFound();

  const imgs = p.images || [];
  const realPhotos = hasRealImages(imgs);
  const showSoonPhotosTag = realPhotos && imgs.length <= 4;
  const has360 = Boolean(p.url_360);
  const precioOriginal = parseInt(p.precio_original || 0);
  const precioVenta = parseInt(p.precio_venta || 0);
  const descuento =
    precioOriginal && precioVenta && precioOriginal > precioVenta
      ? Math.round(((precioOriginal - precioVenta) / precioOriginal) * 100)
      : 0;

  const waMsg = encodeURIComponent(
    `Hola, estoy interesado(a) en el inmueble:\n\n📋 NID: ${p.nid}\n🏡 Inmueble: ${p.titulo}\n📍 Ubicación: ${[p.barrio, p.conjunto, p.ciudad].filter(Boolean).join(", ")}\n💰 Precio: ${fmt(p.precio_venta)}\n\n¿Me podrías dar más información?`
  );

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: "#F0F3F7", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #E8ECF0", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#1B4F72", fontWeight: 700, fontSize: 13, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1.5px solid #1B4F72" }}>
          ← Volver al catálogo
        </Link>
        <span style={{ color: "#7F8C8D", fontSize: 12 }}>Inmobiliaria Buen Futuro</span>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px 40px" }}>
        {/* VENDIDO banner when no photos and no 360 */}
        {!realPhotos && !has360 && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20, position: "relative", paddingTop: "56%", background: "linear-gradient(135deg,#1B2A4A,#2C3E50)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-12deg)", background: "#E67E22", color: "white", padding: "12px 32px", fontSize: "clamp(14px,3vw,24px)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", boxShadow: "0 6px 30px rgba(230,126,34,0.45)", textAlign: "center", zIndex: 1 }}>Apartamentos en Remodelación</div>
          </div>
        )}

        {/* Images */}
        {realPhotos && (
          <ImageGalleryWithLightbox
            imgs={imgs}
            titulo={p.titulo}
            descuento={descuento}
            tipo={p.tipo}
            showSoonPhotosTag={showSoonPhotosTag}
          />
        )}

        {/* Title & Price */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(27,79,114,0.07)" }}>
          <h1 style={{ fontSize: "clamp(16px,4vw,22px)", fontWeight: 800, color: "#1B2A4A", margin: "0 0 8px" }}>{p.titulo}</h1>
          {p.enSubasta && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#F39C12,#D68910)", color: "white", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
              🔨 En Subasta
            </div>
          )}
          <div style={{ color: "#5D6D7E", fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{[p.barrio, p.conjunto, p.ciudad].filter(Boolean).join(" · ")}</span>
          </div>
          {p.direccion && (() => {
            const mapsQuery = [p.direccion, p.conjunto, p.zona_pequeña, p.zona_mediana, p.zona_grande, p.ciudad].filter(Boolean).join(", ");
            const mapsUrl = p.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
            return (
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#1B4F72", fontWeight: 600, textDecoration: "none", background: "#EAF2FB", padding: "4px 10px", borderRadius: 6 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {p.direccion} — Ver en mapa
                </a>
              </div>
            );
          })()}

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: "clamp(20px,5vw,28px)", fontWeight: 800, color: "#1B4F72" }}>{fmt(p.precio_venta)}</span>
            {precioOriginal > precioVenta && (
              <span style={{ fontSize: 14, color: "#999", textDecoration: "line-through" }}>{fmt(p.precio_original)}</span>
            )}
          </div>

          {p.admin > 0 && (
            <div style={{ fontSize: 12, color: "#7F8C8D", marginTop: 4 }}>Administración: {fmt(p.admin)}/mes</div>
          )}

          {p.bonoHabi > 0 && (
            <div style={{ marginTop: 10, background: "linear-gradient(135deg,#7B2FF7,#5B1FA6)", color: "white", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
              🎁 Bono HABI: {fmt(p.bonoHabi)}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(27,79,114,0.07)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1B2A4A", margin: "0 0 14px" }}>Características</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
            {[
              ["📐 Área", p.area ? p.area + " m²" : null],
              ["🛏 Habitaciones", p.habitaciones],
              ["🚿 Baños", p.baños],
              ["🚗 Garajes", p.garaje],
              ["🏢 Piso", p.piso],
              ["⚡ Estrato", p.estrato],
              ["🛗 Ascensor", p.ascensor ? "Sí" : p.ascensor === false ? "No" : null],
              ["📦 Depósito", p.deposito ? "Sí" : null],
            ]
              .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== "0" && v !== 0)
              .map(([label, value]) => (
                <div key={label} style={{ background: "#F0F3F7", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#7F8C8D", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2A4A" }}>{value}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Description */}
        {p.descripcion && (
          <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(27,79,114,0.07)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1B2A4A", margin: "0 0 10px" }}>Descripción</h2>
            <p style={{ fontSize: 13, color: "#5D6D7E", lineHeight: 1.7, margin: 0 }}>{p.descripcion}</p>
          </div>
        )}

        {/* 360 Tour */}
        {has360 && (
          <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(27,79,114,0.07)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1B2A4A", margin: "0 0 10px" }}>Tour Virtual 360°</h2>
            <iframe
              src={p.url_360}
              title="Tour 360°"
              loading="lazy"
              style={{ width: "100%", height: 360, border: "none", borderRadius: 10 }}
              allowFullScreen
            />
          </div>
        )}

        {/* Ref & HABI link */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: "0 2px 12px rgba(27,79,114,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#7F8C8D" }}>Ref. HABI: <strong style={{ color: "#1B2A4A" }}>{p.nid}</strong></span>
          {p.url_habi && (
            <a href={p.url_habi} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1B4F72", fontWeight: 600, textDecoration: "none" }}>
              Ver en HABI →
            </a>
          )}
        </div>

        {/* CTA Buttons */}
        <PropertyCTAButtons property={{
          nid: p.nid,
          titulo: p.titulo,
          tipo: p.tipo,
          barrio: p.barrio,
          conjunto: p.conjunto,
          ciudad: p.ciudad,
          precio_venta: p.precio_venta,
          precioFormateado: fmt(p.precio_venta),
        }} />
      </div>
    </div>
  );
}
