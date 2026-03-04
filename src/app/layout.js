import "./globals.css";

export const metadata = {
  title: "Inmobiliaria Buen Futuro | Aliados HABI - Catálogo de Propiedades",
  description:
    "Encuentra tu hogar ideal con Inmobiliaria Buen Futuro. 59 propiedades HABI con tours 360°, descuentos exclusivos y financiación. Aliados oficiales HABI en Colombia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
