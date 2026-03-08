import { INV } from "@/data/properties";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
        {/* Images */}
        {realPhotos && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20, position: "relative", paddingTop: "56%", background: "#E8ECF0" }}>
            <Image
              src={imgs[0]}
              alt={p.titulo}
              fill
              sizes="(max-width:768px) 100vw, 780px"
              priority
              style={{ objectFit: "cover" }}
            />
            {descuento > 0 && (
              <div style={{ position: "absolute", top: 12, left: 12, background: "#E74C3C", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
                -{descuento}%
              </div>
            )}
            {p.tipo && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "#1B4F72", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {p.tipo}
              </div>
            )}
          </div>
        )}

        {/* Thumbnail strip */}
        {realPhotos && imgs.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {imgs.slice(1).map((img, i) => (
              <Image key={i} src={img} alt="" width={80} height={60} style={{ objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ))}
          </div>
        )}

        {/* Title & Price */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(27,79,114,0.07)" }}>
          <h1 style={{ fontSize: "clamp(16px,4vw,22px)", fontWeight: 800, color: "#1B2A4A", margin: "0 0 8px" }}>{p.titulo}</h1>
          <div style={{ color: "#5D6D7E", fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{[p.barrio, p.conjunto, p.ciudad].filter(Boolean).join(" · ")}</span>
            {(p.conjunto || p.barrio) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.conjunto, p.barrio, p.ciudad].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#1B4F72", fontWeight: 600, textDecoration: "none", background: "#EAF2FB", padding: "3px 8px", borderRadius: 6 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                Ver en mapa
              </a>
            )}
          </div>

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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href={`https://wa.me/${WA}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg,#1B4F72,#1B2A4A)", color: "white", borderRadius: 14, padding: "15px 20px", fontWeight: 800, fontSize: 16, textDecoration: "none" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Quiero información
          </a>
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola, quiero agendar una visita para el inmueble:\n\n📋 NID: ${p.nid}\n🏡 ${p.titulo}\n📍 ${[p.barrio, p.ciudad].filter(Boolean).join(", ")}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", color: "#1B4F72", borderRadius: 14, padding: "14px 20px", fontWeight: 700, fontSize: 15, textDecoration: "none", border: "2px solid #1B4F72" }}
          >
            📅 Agendar visita
          </a>
        </div>
      </div>
    </div>
  );
}
