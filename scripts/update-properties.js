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
  propertiesJsPath: path.join(ROOT, "src", "data", "properties.js"),
  minImages: 1,
  maxImages: 12,
  userAgent: "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)",
  delayBetweenRequestsMs: 800
};

function getMatterportUrl(property) {
  const candidate = (property?.url_360 || "").trim();
  if (!candidate || !candidate.startsWith("http")) return null;
  if (!candidate.toLowerCase().includes("matterport.com")) return null;
  return candidate;
}

function normalizeImageUrl(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let candidate = rawUrl.trim();
  if (!candidate) return null;

  // Clean common wrappers from srcset/json strings.
  candidate = candidate.replace(/^url\((.*)\)$/i, "$1").replace(/^['"]|['"]$/g, "");

  if (candidate.startsWith("data:")) return null;
  if (candidate.startsWith("//")) candidate = `https:${candidate}`;

  try {
    const absolute = new URL(candidate, baseUrl).href;
    return absolute;
  } catch {
    return null;
  }
}

function detectImageBaseUrl(pageUrl, $) {
  const ogImage = $('meta[property="og:image"]').attr("content");
  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  const sample = [ogImage, twitterImage].find(Boolean) || "";

  if (sample && /^https?:\/\//i.test(sample)) {
    return sample.replace(/\/venta-[^/?#]+(?:\?.*)?$/i, "/");
  }

  try {
    const { origin } = new URL(pageUrl);
    return `${origin}/`;
  } catch {
    return "https://d3hzflklh28tts.cloudfront.net/";
  }
}

function buildImageUrl(imagePath, imageBaseUrl) {
  if (!imagePath || typeof imagePath !== "string") return null;
  const clean = imagePath.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;

  try {
    return new URL(clean.replace(/^\//, ""), imageBaseUrl).href;
  } catch {
    return null;
  }
}

function getGatsbyPageDataUrl(listingUrl) {
  try {
    const parsed = new URL(listingUrl);
    const cleanPath = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");
    if (!cleanPath) return null;
    return `${parsed.origin}/page-data/${cleanPath}/page-data.json`;
  } catch {
    return null;
  }
}

async function scrapeCarouselImagesFromPageData(url, imageBaseUrl) {
  const pageDataUrl = getGatsbyPageDataUrl(url);
  if (!pageDataUrl) return [];

  try {
    const { data } = await axios.get(pageDataUrl, {
      timeout: 12000,
      headers: { "User-Agent": CONFIG.userAgent }
    });

    const carousel =
      data?.result?.pageContext?.propertyDetail?.property?.images ||
      data?.result?.pageContext?.property?.images ||
      [];

    if (!Array.isArray(carousel) || !carousel.length) return [];

    const mapped = carousel
      .map((img) => {
        const raw = typeof img === "string" ? img : img?.url;
        const full = buildImageUrl(raw, imageBaseUrl);
        if (!full) return null;
        return {
          url: full,
          order: typeof img === "object" ? Number(img?.order || 0) : 0
        };
      })
      .filter(Boolean)
      .filter((item) => isValidImageUrl(item.url))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item) => item.url);

    const uniqueByKey = new Map();
    for (const imgUrl of mapped) {
      const key = imageKey(imgUrl);
      if (!uniqueByKey.has(key)) uniqueByKey.set(key, imgUrl);
    }

    return [...uniqueByKey.values()].slice(0, CONFIG.maxImages);
  } catch {
    return [];
  }
}

function imageKey(url) {
  const clean = url.split("?")[0].split("#")[0];
  const ventaFile = clean.match(/venta-[^/]+\.(?:jpe?g|png|webp|avif)$/i);
  return ventaFile ? ventaFile[0].toLowerCase() : clean.toLowerCase();
}

function isValidImageUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();

  if (!lower.startsWith("http")) return false;
  if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) return false;
  if (lower.includes("sprite") || lower.includes("map") || lower.includes("marker")) return false;
  if (lower.includes("/static/")) return false;
  if (lower.includes("whatsapp") || lower.includes("gps") || lower.includes("outlined")) return false;

  const looksLikeImage = /\.(jpe?g|png|webp|avif)(\?|$)/i.test(lower);
  if (!looksLikeImage) return false;

  // Prioritize property-gallery style image URLs.
  const knownImageCdn = lower.includes("cloudfront.net");
  const ventaPattern = /\/venta-[^/]+\.(?:jpe?g|png|webp|avif)(\?|$)/i.test(lower);
  return knownImageCdn || ventaPattern;
}

function scoreImage(url) {
  const lower = url.toLowerCase();
  let score = 0;

  if (lower.includes("cloudfront.net")) score += 8;
  if (lower.includes("venta-")) score += 5;
  if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(lower)) score += 2;
  if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) score -= 20;

  return score;
}

function extractUrlsFromObject(value, collector) {
  if (!value) return;

  if (typeof value === "string") {
    if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(value) || value.includes("cloudfront.net")) {
      collector.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) extractUrlsFromObject(item, collector);
    return;
  }

  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const keyLower = key.toLowerCase();
      if (["image", "images", "photo", "photos", "gallery", "media"].includes(keyLower)) {
        extractUrlsFromObject(nested, collector);
      } else {
        extractUrlsFromObject(nested, collector);
      }
    }
  }
}

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
    const $ = cheerio.load(data);
    const imageBaseUrl = detectImageBaseUrl(url, $);

    // Primary: JSON "image" array embedded in HABI/Gatsby pages (fastest + most accurate)
    const imgArrayMatch = data.match(/"image":\s*\[([^\]]*)\]/);
    if (imgArrayMatch) {
      try {
        const imgs = JSON.parse("[" + imgArrayMatch[1] + "]");
        const resolved = imgs.map(img => img.startsWith("http") ? img : HABI_CDN + img).filter(Boolean);
        if (resolved.length >= CONFIG.minImages) return resolved.slice(0, CONFIG.maxImages);
      } catch {}
    }

    // Secondary: Gatsby page-data carousel
    const carouselImages = await scrapeCarouselImagesFromPageData(url, imageBaseUrl);
    if (carouselImages.length >= CONFIG.minImages) {
      return carouselImages.slice(0, CONFIG.maxImages);
    }

    const candidates = [];

    // 1) Metadata images.
    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    if (ogImage) candidates.push(ogImage);
    if (twitterImage) candidates.push(twitterImage);

    // 2) Direct DOM images.
    $("img").each((_, el) => {
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-lazy-src") ||
        $(el).attr("data-main-image") ||
        $(el).attr("data-srcset");
      if (src) candidates.push(src);

      const srcset = $(el).attr("srcset");
      if (srcset) {
        const first = srcset.split(",")[0]?.trim().split(" ")[0];
        if (first) candidates.push(first);
      }
    });

    // 3) Picture/source srcset.
    $("source").each((_, el) => {
      const srcset = $(el).attr("srcset");
      if (srcset) {
        const first = srcset.split(",")[0]?.trim().split(" ")[0];
        if (first) candidates.push(first);
      }
    });

    // 4) Gatsby venta-* file names
    const ventaMatches = data.match(/venta-[a-z0-9]+-[0-9]+\.(?:jpe?g|png|webp|avif)/gi) || [];
    for (const match of ventaMatches) {
      const full = buildImageUrl(match, imageBaseUrl);
      if (full) candidates.push(full);
    }

    // 5) Fallback regex over whole HTML
    const regexMatches = data.match(/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>]*)?/gi) || [];
    candidates.push(...regexMatches);

    const normalized = candidates
      .map((raw) => normalizeImageUrl(raw, url))
      .filter((imgUrl) => isValidImageUrl(imgUrl));

    const uniqueByKey = new Map();
    for (const img of normalized) {
      const key = imageKey(img);
      if (!uniqueByKey.has(key)) uniqueByKey.set(key, img);
    }

    const uniqueSorted = [...uniqueByKey.values()].sort((a, b) => scoreImage(b) - scoreImage(a));
    return uniqueSorted.slice(0, CONFIG.maxImages);
  } catch {
    return [];
  }
}

async function validate360(url) {
  if (!url) return false;
  try {
    // Primary: OEmbed endpoint – returns 200 only for published/active models.
    // NOTE: The oEmbed API can return 404 for valid/working models, so a 404
    // response is NOT treated as definitive failure – we always fall through
    // to the direct page check.
    const oembedUrl = `https://my.matterport.com/api/v1/oembed?url=${encodeURIComponent(url)}`;
    const oembedResp = await axios.get(oembedUrl, {
      timeout: 8000,
      headers: { "User-Agent": CONFIG.userAgent },
      validateStatus: null
    });
    if (oembedResp.status === 200 && oembedResp.data?.html) return true;
    // Do NOT return false on 404/403/400 – oEmbed is unreliable for some models.
    // Always fall through to the direct page check below.

    // Fallback: fetch the page directly and check for error indicators.
    // Matterport returns HTTP 200 even for unavailable models; detect via content.
    const { data, status } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": CONFIG.userAgent },
      validateStatus: null
    });
    if (status !== 200) return false;

    const errorPatterns = [
      /not\s+available/i,
      /no\s+est[aá]\s+disponible/i,
      /"available"\s*:\s*false/i,
      /"published"\s*:\s*false/i,
      /model[_\s]not[_\s]found/i,
    ];
    if (errorPatterns.some((p) => p.test(data))) return false;

    // Valid model pages always contain both "showcase" and "matterport".
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
    let removedWithoutMedia = 0;
    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      const habiUrl = p.url_habi || p.url || "";
      console.log(`[${i+1}/${properties.length}] ${p.nid || i}: scraping fotos...`);

      const [scrapedImages, is360Valid] = await Promise.all([
        habiUrl ? scrapeImages(habiUrl) : Promise.resolve([]),
        p.url_360 ? validate360(p.url_360) : Promise.resolve(false)
      ]);

      if (!is360Valid && p.url_360) {
        console.log(`  ⚠️  360 inválido (404/error) - se eliminará: ${p.url_360}`);
      }
      console.log(`  📸 ${scrapedImages.length} fotos | 360: ${is360Valid ? "✅" : "❌"}`);

      const images = scrapedImages.length > 0 ? scrapedImages : [CONFIG.placeholderImage];

      enriched.push({
        ...p,
        images,
        url_360: is360Valid ? p.url_360 : "",
        precio: parseInt(p.precio_venta || 0, 10)
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

    console.log(`✅ ¡Inventario actualizado con éxito! (${enriched.length} propiedades)`);
    console.log(`🗑️ Propiedades eliminadas por falta de fotos/Matterport: ${removedWithoutMedia}`);
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  }
}

main();