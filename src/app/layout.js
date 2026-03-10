import "./globals.css";
import PixelScripts from "@/components/PixelScripts";
import CookieConsent from "@/components/CookieConsent";

export const metadata = {
  metadataBase: new URL("https://buenfuturo.co"),
  title: "Inmobiliaria Buen Futuro | Aliados HABI - Catálogo de Propiedades",
  description:
    "Encuentra tu hogar ideal con Inmobiliaria Buen Futuro. más de 100 propiedades HABI con tours 360°, descuentos exclusivos y financiación. Aliados oficiales HABI en Colombia.",
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
      <head>
        {/* TikTok Pixel Code Start - Buen Futuro Web (D6NG0U3C77U75L0FFE4G) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;
  var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){
    for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++) ttq.setAndDefer(e,ttq.methods[n]);
    return e
  };
  ttq.load=function(e,n){
    var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
    ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,
    ttq._t=ttq._t||{},ttq._t[e]=+new Date,
    ttq._o=ttq._o||{},ttq._o[e]=n||{};
    var s=document.createElement("script");
    s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;
    var a=document.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(s,a)
  };
  ttq.load('D6NG0U3C77U75L0FFE4G');
  ttq.page();
}(window, document, 'ttq');
`,
          }}
        />
        {/* TikTok Pixel Code End */}
      </head>
      <body>
        <PixelScripts />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
