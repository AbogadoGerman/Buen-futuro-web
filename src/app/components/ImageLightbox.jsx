"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

export default function ImageLightbox({ imgs, startIndex, onClose }) {
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 42, height: 42, color: "white", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>✕</button>
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 12px", borderRadius: 14, fontSize: 13, fontWeight: 600, zIndex: 3 }}>{ii + 1}/{imgs.length}</div>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div className="embla-lb" ref={lbRef} style={{ height: "100%" }}>
            <div className="embla-lb__container">
              {imgs.map((img, i) => (
                <div className="embla-lb__slide" key={img + "-" + i} style={{ position: "relative" }}>
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
