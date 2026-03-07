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
  userAgent: "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)",
  delayBetweenRequestsMs: 800
};

async function getGoogleDriveClient() {
  // Buscar service-account.json en la raíz del proyecto o via variable de entorno
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
    const { data } = await axios.get(url, { timeout: 12000, headers: { "User-Agent": CONFIG.userAgent } });
    const images = [];

    // 1. Extract from JSON "image" array embedded in HABI pages
    const imgArrayMatch = data.match(/"image":\s*\[([^\]]*)\]/);
    if (imgArrayMatch) {
      try {
        const imgs = JSON.parse("[" + imgArrayMatch[1] + "]");
        imgs.forEach(img => {
          const fullUrl = img.startsWith("http") ? img : HABI_CDN + img;
          images.push(fullUrl);
        });
      } catch {}
    }

    // 2. Fallback: extract from og:image and img tags via cheerio
    if (images.length === 0) {
      const $ = cheerio.load(data);
      const ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) images.push(ogImage);

      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && src.startsWith("http") && !src.includes("logo")) images.push(src);
      });
    }

    return [...new Set(images)].slice(0, 10);
  } catch {
    return [];
  }
}

async function validate360(url) {
  if (!url) return false;
  try {
    const { data } = await axios.get(url, { timeout: 10000, headers: { "User-Agent": CONFIG.userAgent } });
    return data.includes("matterport") || data.includes("showcase") || data.includes("model");
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
        console.log(`  ⚠️  360 inválido (404/error) - se eliminará: ${p.url_360}`);
      }
      console.log(`  📸 ${images.length} fotos | 360: ${is360Valid ? "✅" : "❌"}`);

      enriched.push({
        ...p,
        images: images.length > 0 ? images : [CONFIG.placeholderImage],
        url_360: is360Valid ? p.url_360 : "",
        precio: parseInt(p.precio_venta || 0)
      });
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenRequestsMs));
    }

    const jsonData = JSON.stringify(enriched, null, 2);

    // Guardar en src/data/ para imports
    if (!fs.existsSync(path.dirname(CONFIG.outputPath))) fs.mkdirSync(path.dirname(CONFIG.outputPath), { recursive: true });
    fs.writeFileSync(CONFIG.outputPath, jsonData);

    // Guardar en public/data/ para fetch desde el frontend
    if (!fs.existsSync(path.dirname(CONFIG.publicOutputPath))) fs.mkdirSync(path.dirname(CONFIG.publicOutputPath), { recursive: true });
    fs.writeFileSync(CONFIG.publicOutputPath, jsonData);

    // Generar properties.js con el formato que usa el frontend
    const pageFormatted = enriched.map((p) => ({
      nid: p.nid,
      titulo: p.titulo,
      tipo: p.tipo_de_propiedad,
      barrio: p.barrio,
      conjunto: p.conjunto,
      ciudad: p.ciudad,
      descripcion: p.descripcion,
      area: p.area,
      habitaciones: p.num_habitaciones,
      baños: p.banos,
      garaje: p.garajes,
      piso: p.num_piso,
      estrato: p.estrato,
      ascensor: p.tiene_ascensor === "1" || p.tiene_ascensor === 1
        ? true
        : p.tiene_ascensor === "0" || p.tiene_ascensor === 0
        ? false
        : null,
      bonoHabi: parseInt(p.bonus_value || 0),
      admin: parseInt(p.costo_administracion || 0),
      precio_venta: p.precio_venta,
      precio_original: p.precio_anterior,
      url_360: p.url_360 || "",
      url_habi: p.url_habi || p.url || "",
      images: p.images || [],
    }));
    const propertiesJs = `export const INV = ${JSON.stringify(pageFormatted, null, 2)};\n`;
    fs.writeFileSync(CONFIG.propertiesJsPath, propertiesJs);
    console.log("✅ ¡Inventario actualizado con éxito!");
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  }
}

main();