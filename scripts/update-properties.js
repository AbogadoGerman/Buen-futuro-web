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
  minImages: 1,
  maxImages: 8,
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
  const keyPath = path.join(ROOT, "service-account.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error("Falta el archivo service-account.json. Asegúrate de tenerlo en la raíz.");
  }
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
    const imageBaseUrl = detectImageBaseUrl(url, $);

    // Primary source: Gatsby page-data carousel used by "Ver las N imágenes".
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

    // 4) JSON-LD and embedded scripts with gallery arrays.
    $("script[type='application/ld+json']").each((_, el) => {
      const raw = $(el).html();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        extractUrlsFromObject(parsed, candidates);
      } catch {
        // Ignore malformed JSON-LD blocks.
      }
    });

    const nextDataRaw = $("#__NEXT_DATA__").html();
    if (nextDataRaw) {
      try {
        const parsed = JSON.parse(nextDataRaw);
        extractUrlsFromObject(parsed, candidates);
      } catch {
        // Ignore malformed next data.
      }
    }

    // Gatsby pages: search inline JSON for "venta-..." image file names and expand with detected base URL.
    const ventaMatches = data.match(/venta-[a-z0-9]+-[0-9]+\.(?:jpe?g|png|webp|avif)/gi) || [];
    for (const match of ventaMatches) {
      const full = buildImageUrl(match, imageBaseUrl);
      if (full) candidates.push(full);
    }

    // 5) Fallback regex over whole HTML for image URLs.
    const regexMatches = data.match(/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>]*)?/gi) || [];
    candidates.push(...regexMatches);

    const normalized = candidates
      .map((raw) => normalizeImageUrl(raw, url))
      .filter((imgUrl) => isValidImageUrl(imgUrl));

    // Deduplicate with a key that collapses resized variants of the same photo.
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
      console.log(`[${i+1}/${properties.length}] Obteniendo fotos para el inmueble: ${p.nid || i}...`);
      const scrapedImages = p.url ? await scrapeImages(p.url) : [];

      const matterportImage = getMatterportUrl(p);
      let images = [];

      if (scrapedImages.length >= CONFIG.minImages) {
        images = scrapedImages.slice(0, CONFIG.maxImages);
      } else if (matterportImage) {
        images = [matterportImage];
        console.warn(`⚠️ ${p.nid || i}: ${scrapedImages.length} fotos reales; se usará solo Matterport.`);
      } else {
        removedWithoutMedia += 1;
        console.warn(`⚠️ ${p.nid || i}: sin fotos reales suficientes y sin Matterport. Propiedad eliminada.`);
        await new Promise(r => setTimeout(r, CONFIG.delayBetweenRequestsMs));
        continue;
      }

      enriched.push({
        ...p,
        images,
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
    
    console.log(`✅ ¡Inventario actualizado con éxito! (${enriched.length} propiedades)`);
    console.log(`🗑️ Propiedades eliminadas por falta de fotos/Matterport: ${removedWithoutMedia}`);
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  }
}

main();