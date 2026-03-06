import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://buenfuturo.vercel.app"),
  title: "Inmobiliaria Buen Futuro | Aliados HABI - Catálogo de Propiedades",
  description:
    "Encuentra tu hogar ideal con Inmobiliaria Buen Futuro. 59 propiedades HABI con tours 360°, descuentos exclusivos y financiación. Aliados oficiales HABI en Colombia.",
  openGraph: {
    title: "Inmobiliaria Buen Futuro | Aliados HABI",
    description:
      "Encuentra tu hogar ideal. Catálogo de propiedades HABI con tours 360°, descuentos exclusivos y financiación en Colombia.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Inmobiliaria Buen Futuro" }],
    type: "website",
    locale: "es_CO",
    siteName: "Inmobiliaria Buen Futuro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inmobiliaria Buen Futuro | Aliados HABI",
    description:
      "Encuentra tu hogar ideal. Catálogo de propiedades con tours 360° y descuentos exclusivos.",
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
      <body>{children}</body>
    </html>
  );
}
