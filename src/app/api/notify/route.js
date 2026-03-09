import nodemailer from "nodemailer";
import crypto from "crypto";

const META_PIXEL_ID = "925375136552561";
const META_ACCESS_TOKEN = "EAAeWUmWmsZAoBQxJkP2yJ6VHDIKcDyZCcgybQm60Pq8d5sO6gsa9twkYaYKkAJvn0nfZBKpcixZAZCeiUVyLqQbq2esjkFiz1hZAqfVIGAyI4QDZAZBdn6Ho4hiU0PVOBfORLQfcoLCUZCx2BuLDidDzGy9BuKEJlWnNmLI8H4lLw6Gb78Fyr2CefqJ0QX9s7FLkZA3QZDZD";

async function sendMetaConversionsEvent({ eventName, nid, titulo, precio, sourceUrl, userAgent, clientIp, fbp, fbc }) {
  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: sourceUrl || "https://buenfuturo.vercel.app",
        user_data: {
          client_ip_address: clientIp || undefined,
          client_user_agent: userAgent || undefined,
          fbp: fbp || undefined,
          fbc: fbc || undefined,
        },
        custom_data: {
          content_ids: [nid],
          content_name: titulo,
          content_type: "product",
          value: parseFloat(String(precio).replace(/[^0-9]/g, "")) || 0,
          currency: "COP",
        },
      },
    ],
  };

  // Remove undefined values from user_data
  Object.keys(eventData.data[0].user_data).forEach((key) => {
    if (!eventData.data[0].user_data[key]) delete eventData.data[0].user_data[key];
  });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      console.error("Meta CAPI error:", JSON.stringify(result));
    }
    return result;
  } catch (err) {
    console.error("Meta CAPI fetch error:", err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nid, titulo, ubicacion, precio, area, habitaciones, banos, bonoHabi, eventName, sourceUrl, fbp, fbc } = body;

    if (!nid) {
      return Response.json({ error: "Falta el ID del inmueble" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    // Send email + Meta CAPI in parallel
    const emailPromise = (async () => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const fecha = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

      await transporter.sendMail({
        from: `"Buen Futuro Web" <${process.env.GMAIL_USER}>`,
        to: process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
        subject: `🏠 Nuevo interesado - Ref ${nid} | ${titulo || "Sin título"}`,
        html: `
          <div style="font-family:'Outfit',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#1B4F72,#2E86C1);padding:24px;text-align:center">
              <h1 style="color:white;margin:0;font-size:22px">🏠 Nuevo Interesado</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Inmobiliaria Buen Futuro</p>
            </div>
            <div style="padding:24px">
              <p style="color:#555;font-size:13px;margin:0 0 16px">Un visitante de la web abrió WhatsApp para consultar por este inmueble:</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:8px 12px;background:#e8f4fd;font-weight:700;border-radius:6px 0 0 0">📋 Referencia</td><td style="padding:8px 12px;background:#e8f4fd;border-radius:0 6px 0 0">${nid}</td></tr>
                <tr><td style="padding:8px 12px;font-weight:700">🏡 Inmueble</td><td style="padding:8px 12px">${titulo || "N/A"}</td></tr>
                <tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:700">📍 Ubicación</td><td style="padding:8px 12px;background:#f1f1f1">${ubicacion || "N/A"}</td></tr>
                <tr><td style="padding:8px 12px;font-weight:700">💰 Precio</td><td style="padding:8px 12px">${precio || "Consultar"}</td></tr>
                <tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:700">📐 Área</td><td style="padding:8px 12px;background:#f1f1f1">${area || "N/A"} m²</td></tr>
                <tr><td style="padding:8px 12px;font-weight:700">🛏️ Habitaciones</td><td style="padding:8px 12px">${habitaciones || "N/A"}</td></tr>
                <tr><td style="padding:8px 12px;background:#f1f1f1;font-weight:700">🚿 Baños</td><td style="padding:8px 12px;background:#f1f1f1">${banos || "N/A"}</td></tr>
                ${bonoHabi ? `<tr><td style="padding:8px 12px;font-weight:700">🎁 Bono HABI</td><td style="padding:8px 12px;color:#27ae60;font-weight:700">${bonoHabi}</td></tr>` : ""}
              </table>
              <p style="color:#888;font-size:11px;margin:20px 0 0;text-align:center">📅 ${fecha} — Notificación automática de buenfuturo.vercel.app</p>
            </div>
          </div>
        `,
      });
    })();

    const metaPromise = eventName
      ? sendMetaConversionsEvent({
          eventName,
          nid,
          titulo,
          precio,
          sourceUrl,
          userAgent,
          clientIp,
          fbp,
          fbc,
        })
      : Promise.resolve();

    await Promise.allSettled([emailPromise, metaPromise]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Error en /api/notify:", err.message);
    return Response.json({ error: "Error procesando solicitud" }, { status: 500 });
  }
}
