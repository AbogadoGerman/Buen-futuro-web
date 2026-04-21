const { google } = require("googleapis");
const XLSX = require("xlsx");
const axios = require("axios");
const { parse } = require("papaparse");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);

const CONFIG = {
  // ID de tu carpeta de Google Drive
  folderId: "1o_5NwB-fK84NOTbNQTKmNWuVmMOwvaOG",
  outputPath: path.join(ROOT, "src", "data", "inventory.json"),
  publicOutputPath: path.join(ROOT, "public", "data", "inventory.json"),
  propertiesJsPath: path.join(ROOT, "src", "data", "properties.js"),
  placeholderImage: "/window.svg",
  maxImages: 20,
  userAgent: "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)",
  delayBetweenRequestsMs: 800
};

async function getGoogleDriveClient() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
    || path.join(ROOT, "service-account.json");

  if (!fs.existsSync(keyPath)) {
    console.error("╔══════════════════════════════════════════════════════════════╗");
    console.error("║  ERROR: No se encontró service-account.json                 ║");
    console.error("╠══════════════════════════════════════════════════════════════╣");
    console.error("║  Este archivo NO se sube a GitHub (.gitignore lo protege).  ║");
    console.error("║  Debes colocarlo manualmente en la raíz del proyecto:       ║");
    console.error(`║  ${ROOT}/service-account.json`);
    console.error("║                                                             ║");
    console.error("║  Alternativa: define la variable de entorno                 ║");
    console.error("║  GOOGLE_SERVICE_ACCOUNT_PATH=/ruta/a/service-account.json   ║");
    console.error("╚══════════════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  console.log(`🔑 Usando credenciales: ${keyPath}`);
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

async function findLatestFile(drive) {
  console.log("🔍 Buscando el archivo más reciente en la carpeta de Drive...");
  const response = await drive.files.list({
    q: `'${CONFIG.folderId}' in parents and name contains 'Inmuebles-habi' and trashed = false`,
    fields: "files(id, name, mimeType, createdTime)",
    orderBy: "createdTime desc",
    pageSize: 1
  });
  if (!response.data.files.length) throw new Error("No se encontró ningún archivo con 'Inmuebles-habi'.");
  return response.data.files[0];
}

const HABI_CDN = "https://d3hzflklh28tts.cloudfront.net/";

async function scrapeImages(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 12000,
      headers: {
        // User-agent real de Chrome para evitar el bloqueo 503 de habi.co
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-CO,es;q=0.9,en-US;q=0.8,en;q=0.7",
      }
    });
    const images = [];

    // Buscar en TODOS los bloques JSON-LD, no solo el primero.
    // El primer bloque suele tener solo 3 imágenes para SEO; otros pueden tener más.
    const jsonLdBlocks = data.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of jsonLdBlocks) {
      const content = block.replace(/<[^>]+>/g, "");
      const match = content.match(/"image":\s*\[([^\]]*)\]/);
      if (!match) continue;
      try {
        const imgs = JSON.parse("[" + match[1] + "]");
        imgs.forEach(img => {
          const fullUrl = img.startsWith("http") ? img : HABI_CDN + img;
          images.push(fullUrl);
        });
      } catch {}
    }

    // Buscar URLs del CDN de Habi directamente en el HTML (carrusel, estado JS, etc.)
    const cdnRegex = /https?:\/\/d3hzflklh28tts\.cloudfront\.net\/[^\s"'\\<>,]+\.(?:jpe?g|png|webp|avif)/gi;
    const cdnMatches = data.match(cdnRegex) || [];
    cdnMatches.forEach(u => images.push(u));

    if (images.length === 0) {
      const $ = cheerio.load(data);
      const ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) images.push(ogImage);

      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && src.startsWith("http") && !src.includes("logo")) images.push(src);
      });
    }

    return [...new Set(images)].slice(0, CONFIG.maxImages);
  } catch {
    return [];
  }
}

async function validate360(url) {
  if (!url) return false;
  try {
    // Primary: OEmbed endpoint – returns 200 only for published/active models
    const oembedUrl = `https://my.matterport.com/api/v1/oembed?url=${encodeURIComponent(url)}`;
    const oembedResp = await axios.get(oembedUrl, {
      timeout: 8000,
      headers: { "User-Agent": CONFIG.userAgent },
      validateStatus: null
    });
    if (oembedResp.status === 200 && oembedResp.data?.html) return true;

    // Do NOT return false on 404/403/400 – oEmbed is unreliable for some models.
    // Always fall through to the direct page check below.

    // Fallback: fetch the page and check for error indicators
    const { data, status } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": CONFIG.userAgent },
      validateStatus: null
    });
    if (status !== 200) return false;

    // Matterport returns HTTP 200 even for unavailable models; detect via content
    const errorPatterns = [
      /not\s+available/i,
      /no\s+est[aá]\s+disponible/i,
      /"available"\s*:\s*false/i,
      /"published"\s*:\s*false/i,
      /model[_\s]not[_\s]found/i,
    ];
    if (errorPatterns.some((p) => p.test(data))) return false;

    return data.includes("showcase") && data.includes("matterport");
  } catch {
    return false;
  }
}

async function main() {
  try {
    const drive = await getGoogleDriveClient();
    const file = await findLatestFile(drive);
    console.log(`📄 Procesando archivo: ${file.name}`);

    const res = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);
    
    let csvData;
    if (file.name.endsWith(".xlsx")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    } else {
      csvData = buffer.toString();
    }

    const { data: properties } = parse(csvData, { header: true, skipEmptyLines: true });
    
    const enriched = [];
    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      const habiUrl = p.url_habi || p.url || "";
      console.log(`[${i+1}/${properties.length}] ${p.nid || i}: scraping fotos...`);

      const [images, is360Valid] = await Promise.all([
        habiUrl ? scrapeImages(habiUrl) : Promise.resolve([]),
        p.url_360 ? validate360(p.url_360) : Promise.resolve(false)
      ]);

      if (!is360Valid && p.url_360) {
        console.log(`  ⚠️  360 inválido (error confirmado) - se eliminará: ${p.url_360}`);
      }
      console.log(`  📸 ${images.length} fotos | 360: ${is360Valid ? "✅" : "❌"}`);

      enriched.push({
        ...p,
        images: images.length > 0 ? images : [],
        url_360: is360Valid ? p.url_360 : "",
        precio: parseInt(p.precio_venta || 0)
      });
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenRequestsMs));
    }

    const jsonData = JSON.stringify(enriched, null, 2);

    if (!fs.existsSync(path.dirname(CONFIG.outputPath))) fs.mkdirSync(path.dirname(CONFIG.outputPath), { recursive: true });
    fs.writeFileSync(CONFIG.outputPath, jsonData);

    if (!fs.existsSync(path.dirname(CONFIG.publicOutputPath))) fs.mkdirSync(path.dirname(CONFIG.publicOutputPath), { recursive: true });
    fs.writeFileSync(CONFIG.publicOutputPath, jsonData);

    // ✅ CORREGIDO: pageFormatted ahora incluye TODOS los campos que usa page.jsx
    const pageFormatted = enriched.map((p) => ({
      nid: p.nid,
      titulo: p.titulo,
      tipo: p.tipo_de_propiedad || p.tipo || "",
      barrio: p.barrio || "",
      conjunto: p.conjunto || "",
      ciudad: p.ciudad || "",
      // ✅ Campos de localización que antes faltaban
      localidad: p.localidad || "",
      zona_grande: p.zona_grande || "",
      zona_mediana: p.zona_mediana || "",
      zona_pequeña: p.zona_pequeña || p["zona_pequeña"] || "",
      direccion: p.direccion || "",
      googleMapsUrl: p.googleMapsUrl || "",
      descripcion: p.descripcion || "",
      area: p.area || "",
      habitaciones: p.num_habitaciones || p.habitaciones || "",
      baños: p.banos || p["baños"] || "",
      garaje: p.garajes || p.garaje || "",
      piso: p.num_piso || p.piso || "",
      estrato: p.estrato || "",
      ascensor: p.tiene_ascensor === "1" || p.tiene_ascensor === 1
        ? true
        : p.tiene_ascensor === "0" || p.tiene_ascensor === 0
        ? false
        : null,
      bonoHabi: parseInt(p.bonus_value || p.bonoHabi || 0),
      admin: parseInt(p.costo_administracion || p.admin || 0),
      precio_venta: p.precio_venta || "",
      precio_original: p.precio_anterior || p.precio_original || "",
      url_360: p.url_360 || "",
      url_habi: p.url_habi || p.url || "",
      images: p.images || [],
    }));

    const propertiesJs = `export const INV = ${JSON.stringify(pageFormatted, null, 2)};\n`;
    fs.writeFileSync(CONFIG.propertiesJsPath, propertiesJs);
    console.log(`✅ ¡Inventario actualizado! Total inmuebles: ${enriched.length}`);
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  }
}

main();
