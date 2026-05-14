"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

function ImageLightbox({ imgs, startIndex, onClose }) {
  const [ii, setII] = useState(startIndex || 0);
  const [lbRef, lbApi] = useEmblaCarousel({ loop: imgs.length > 1, align: "center", dragFree: false });
  const prev = useCallback(() => lbApi && lbApi.scrollPrev(), [lbApi]);
  const next = useCallback(() => lbApi && lbApi.scrollNext(), [lbApi]);
  const goTo = useCallback(i => lbApi && lbApi.scrollTo(i), [lbApi]);

  useEffect(() => {
    if (!lbApi) return;
    const onSelect = () => setII(lbApi.selectedScrollSnap());
    onSelect();
    lbApi.on("select", onSelect);
    lbApi.on("reInit", onSelect);
    return () => { lbApi.off("select", onSelect); lbApi.off("reInit", onSelect); };
  }, [lbApi]);

  useEffect(() => { if (lbApi) lbApi.scrollTo(startIndex || 0, true); }, [lbApi]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeInGlobal .2s" }}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 42, height: 42, color: "white", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}
      >✕</button>
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 12px", borderRadius: 14, fontSize: 13, fontWeight: 600, zIndex: 3 }}>
        {ii + 1}/{imgs.length}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div className="embla-lb-global" ref={lbRef} style={{ height: "100%" }}>
            <div className="embla-lb-global__container">
              {imgs.map((img, i) => (
                <div className="embla-lb-global__slide" key={img + "-" + i} style={{ position: "relative" }}>
                  <Image src={img} alt="" fill sizes="100vw" style={{ objectFit: "contain" }} unoptimized />
                </div>
              ))}
            </div>
          </div>
          {imgs.length > 1 && <>
            <button onClick={prev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "white", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>
            <button onClick={next} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "white", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>
          </>}
        </div>
        {imgs.length > 1 && (
          <div style={{ flexShrink: 0, padding: "10px 0", display: "flex", justifyContent: "center", gap: 6, overflowX: "auto", maxWidth: "100%" }}>
            {imgs.map((img, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ flexShrink: 0, padding: 0, border: "none", background: "none", cursor: "pointer", opacity: i === ii ? 1 : 0.5, transition: "opacity .2s" }}>
                <Image src={img} alt="" width={56} height={38} style={{ objectFit: "cover", borderRadius: 4, border: i === ii ? "2px solid white" : "2px solid transparent", display: "block" }} unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImageGalleryWithLightbox({ imgs, titulo, descuento, tipo, showSoonPhotosTag }) {
  const [ii, setII] = useState(0);
  const [lbIndex, setLbIndex] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: imgs.length > 1, align: "center", dragFree: false });

  const prev = useCallback(e => { e.stopPropagation(); emblaApi && emblaApi.scrollPrev(); }, [emblaApi]);
  const next = useCallback(e => { e.stopPropagation(); emblaApi && emblaApi.scrollNext(); }, [emblaApi]);
  const goTo = useCallback(i => emblaApi && emblaApi.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setII(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => { emblaApi.off("select", onSelect); emblaApi.off("reInit", onSelect); };
  }, [emblaApi]);

  return (
    <>
      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20, position: "relative", background: "#111", paddingTop: "56%" }}>
        <div className="prop-embla" ref={emblaRef} style={{ position: "absolute", inset: 0 }}>
          <div className="prop-embla__container">
            {imgs.map((img, i) => (
              <div
                className="prop-embla__slide"
                key={img + "-" + i}
                style={{ cursor: "zoom-in" }}
                onClick={() => setLbIndex(i)}
              >
                <Image src={img} alt={titulo} fill sizes="(max-width:768px) 100vw, 780px" style={{ objectFit: "cover" }} unoptimized priority={i === 0} />
              </div>
            ))}
          </div>
        </div>

        {descuento > 0 && (
          <div style={{ position: "absolute", top: 12, left: 12, background: "#E74C3C", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 800, zIndex: 2 }}>
            -{descuento}%
          </div>
        )}
        {tipo && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "#1B4F72", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 2 }}>
            {tipo}
          </div>
        )}
        {showSoonPhotosTag && (
          <div style={{ position: "absolute", top: 12, left: descuento > 0 ? 95 : 12, background: "#F39C12", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, zIndex: 2 }}>
            Fotos Pronto Disponibles
          </div>
        )}

        {imgs.length > 1 && <>
          <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "white", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>‹</button>
          <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "white", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>›</button>
        </>}

        <div style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.6)", color: "white", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, zIndex: 2 }}>
          {ii + 1}/{imgs.length}
        </div>
        <div style={{ position: "absolute", bottom: 38, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 2 }}>
          {imgs.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: 7, height: 7, borderRadius: "50%", border: "1.5px solid white", cursor: "pointer", background: i === ii ? "white" : "rgba(255,255,255,0.35)", padding: 0 }} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: 11, background: "rgba(0,0,0,0.5)", padding: "2px 10px", borderRadius: 10, zIndex: 2, whiteSpace: "nowrap" }}>
          Toca para ampliar
        </div>
      </div>

      {imgs.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {imgs.map((img, i) => (
            <button key={i} onClick={() => { goTo(i); setLbIndex(i); }} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", flexShrink: 0, opacity: i === ii ? 1 : 0.7, transition: "opacity .2s" }}>
              <Image src={img} alt="" width={80} height={60} style={{ objectFit: "cover", borderRadius: 8, border: i === ii ? "2px solid #1B4F72" : "2px solid transparent", display: "block" }} unoptimized />
            </button>
          ))}
        </div>
      )}

      {lbIndex !== null && (
        <ImageLightbox imgs={imgs} startIndex={lbIndex} onClose={() => setLbIndex(null)} />
      )}
    </>
  );
}
