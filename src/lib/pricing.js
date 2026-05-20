const DDC_FACTOR = 1.025;
const HABI_CREDIT_FACTOR = 1.0119;

function toNumber(value) {
  const parsed = parseInt(value ?? 0, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function adjustPropertyPrices(property = {}) {
  const precioVentaBase = toNumber(
    property.precio_venta ?? property.precio ?? property.precio_actual ?? 0
  );
  const precioOriginalBase = toNumber(
    property.precio_original ?? property.precio_anterior ?? 0
  );

  const precioVentaDdC = Math.round(precioVentaBase * DDC_FACTOR);
  const precioOriginalDdC = precioOriginalBase
    ? Math.round(precioOriginalBase * DDC_FACTOR)
    : 0;

  return {
    ...property,
    precio_original_base: String(precioOriginalBase),
    precio_venta_base: String(precioVentaBase),
    precio_habicredit: String(Math.round(precioVentaBase * HABI_CREDIT_FACTOR)),
    precio_habicapital: String(precioVentaBase),
    precio_original: String(precioOriginalDdC),
    precio_venta: String(precioVentaDdC),
  };
}