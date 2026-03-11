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
      <head>
        {/* Google Tag Manager - lo m\u00e1s arriba posible en <head> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-THDMLN24');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* Microsoft Clarity - vuahazu2gs */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "vuahazu2gs");`,
          }}
        />
        {/* End Microsoft Clarity */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) - justo despu\u00e9s de <body> */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-THDMLN24"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {/*
          TikTok Pixel (D6NG0U3C77U75L0FFE4G) y Meta Pixel (925375136552561)
          se inicializan dentro de PixelScripts.jsx SOLO cuando el usuario
          acepta cookies (cookie_consent === 'accepted').
        */}
        <PixelScripts />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
