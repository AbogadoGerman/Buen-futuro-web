const { google } = require("googleapis");
const XLSX = require("xlsx");
const axios = require("axios");
const { parse } = require("papaparse");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const CONFIG = {
  // ID de tu carpeta de Google Drive
  folderId: "1o_5NwB-fK84NOTbNQTKmNWuVmMOwvaOG",
  outputPath: path.join(ROOT, "src", "data", "inventory.json"),
  publicOutputPath: path.join(ROOT, "public", "data", "inventory.json"),
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

async function scrapeImages(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000, headers: { "User-Agent": CONFIG.userAgent } });
    const $ = cheerio.load(data);
    const images = [];
    
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) images.push(ogImage);

    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && src.startsWith("http") && !src.includes("logo")) images.push(src);
    });
    return [...new Set(images)].slice(0, 10);
  } catch {
    return [];
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
      console.log(`[${i+1}/${properties.length}] Obteniendo fotos para el inmueble: ${p.nid || i}...`);
      const images = p.url ? await scrapeImages(p.url) : [];
      enriched.push({
        ...p,
        images: images.length > 0 ? images : [CONFIG.placeholderImage],
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
    
    console.log("✅ ¡Inventario actualizado con éxito!");
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  }
}

main();