import "./globals.css";
import PixelScripts from "@/components/PixelScripts";
import CookieConsent from "@/components/CookieConsent";

export const metadata = {
  metadataBase: new URL("https://buenfuturo.co"),
  title: "Inmobiliaria Buen Futuro | Aliados HABI - Cat\u00e1logo de Propiedades",
  description:
    "Encuentra tu hogar ideal con Inmobiliaria Buen Futuro. m\u00e1s de 100 propiedades HABI con tours 360\u00b0, descuentos exclusivos y financiaci\u00f3n. Aliados oficiales HABI en Colombia.",
  openGraph: {
    title: "Inmobiliaria Buen Futuro | Aliados HABI",
    description:
      "Encuentra tu hogar ideal. Cat\u00e1logo de propiedades HABI con tours 360\u00b0, descuentos exclusivos y financiaci\u00f3n en Colombia.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Inmobiliaria Buen Futuro" }],
    type: "website",
    locale: "es_CO",
    siteName: "Inmobiliaria Buen Futuro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inmobiliaria Buen Futuro | Aliados HABI",
    description:
      "Encuentra tu hogar ideal. Cat\u00e1logo de propiedades con tours 360\u00b0 y descuentos exclusivos.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/inmobiliaria-buen-futuro.png" }, { url: "/favicon.ico", sizes: "32x32" }],
    shortcut: "/inmobiliaria-buen-futuro.png",
    apple: "/inmobiliaria-buen-futuro.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head />
      <body>
        {/*
          TikTok Pixel (D6NG0U3C77U75L0FFE4G) y Meta Pixel (925375136552561)
          se inicializan dentro de PixelScripts.jsx SOLO cuando el usuario
          acepta cookies (cookie_consent === 'accepted').
          NO se duplica el script aqui para evitar doble disparo de eventos.
        */}
        <PixelScripts />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
