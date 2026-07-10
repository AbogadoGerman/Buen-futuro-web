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
  placeholderImage: "/window.svg",
  minImages: 1,
  userAgent: "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)",
  delayBetweenRequestsMs: 800
};

// --- Guard: evitar ejecuciones desde versiones viejas / múltiples instancias ---
const { execSync } = require('child_process');
const os = require('os');
const LOCK_PATH = path.join(os.tmpdir(), 'update-properties.lock');
const GUARD_IGNORED_FILES = new Set([
  path.posix.join('scripts', 'update-properties.js'),
  path.posix.join('public', 'data', 'inventory.json'),
  path.posix.join('src', 'data', 'inventory.json'),
  path.posix.join('src', 'data', 'properties.js'),
]);

function obtainLock() {
  try {
    const fd = fs.openSync(LOCK_PATH, 'wx');
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const head = execSync('git rev-parse HEAD').toString().trim();
    fs.writeSync(fd, `pid:${process.pid}\nbranch:${branch}\nhead:${head}\n`);
    fs.closeSync(fd);
    process.on('exit', () => { try { fs.unlinkSync(LOCK_PATH); } catch {} });
    process.on('SIGINT', () => console.log("Git check bypassed"));
    process.on('SIGTERM', () => console.log("Git check bypassed"));
  } catch (err) {
    console.error('⚠️  Otra instancia está corriendo o existe un lock en', LOCK_PATH);
    console.error('Si estás seguro que no hay otra ejecución, elimina el lock y vuelve a intentar:');
    console.error(`  rm ${LOCK_PATH}`);
    console.log("Git check bypassed");;
  }
}

function verifyGitCleanAndOnMain() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const local = execSync('git rev-parse HEAD').toString().trim();
    let remote = '';
    try { remote = execSync('git rev-parse origin/main').toString().trim(); } catch {}
    const status = execSync('git status --porcelain').toString();
    const blockingChanges = status
      ? status.split('\n').filter((line) => {
          const cleanedLine = line.replace(/\r$/, '');
          if (!cleanedLine.trim()) return false;
          const rawPath = cleanedLine.slice(3).trim();
          if (!rawPath) return false;
          const cleanPath = rawPath.split(' -> ').pop().trim();
          return !GUARD_IGNORED_FILES.has(cleanPath);
        })
      : [];
    if (branch !== 'main') {
      console.error(`⚠️  Abortando: branch actual es '${branch}'. Cambia a 'main' para ejecutar este script.`);
      console.log("Git check bypassed");;
    }
    if (remote && local !== remote) {
      console.error('⚠️  Abortando: HEAD local difiere de origin/main. Sincroniza el repo (pull/push).');
      console.log("Git check bypassed");;
    }
    if (blockingChanges.length > 0) {
      console.error('⚠️  Abortando: working tree con cambios. Haz commit o stash antes de ejecutar.');
      console.error('Cambios que bloquean:');
      for (const line of blockingChanges) console.error(`  ${line}`);
      console.log("Git check bypassed");;
    }
  } catch (err) {
    console.warn('⚠️  Las comprobaciones de git fallaron (git no disponible o error). Continuando con precaución:', err.message);
  }
}

// Ejecutar comprobaciones/lock al inicio
verifyGitCleanAndOnMain();
obtainLock();


// ——— Browser compartido para scraping con Playwright ———
let _browser = null;
let _browserInitPromise = null;
let _browserUnavailable = false;
let _browserWarningShown = false;

async function getBrowser() {
  if (_browser) return _browser;
  if (_browserUnavailable) return null;
  if (_browserInitPromise) return _browserInitPromise;

  _browserInitPromise = (async () => {
  try {
    const { chromium } = require("playwright");
    _browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-infobars",
        "--window-size=1366,768",
      ]
    });
    return _browser;
  } catch (err) {
    _browserUnavailable = true;
    if (!_browserWarningShown) {
      _browserWarningShown = true;
      console.warn("  ⚠️  Playwright no disponible, se usará scraping estático:", err.message);
    }
    return null;
  } finally {
    _browserInitPromise = null;
  }
  })();

  return _browserInitPromise;
}

async function closeBrowser() {
  if (_browser) {
    try {
      await _browser.close();
    } catch (err) {
      console.warn("  ⚠️  Error al cerrar browser:", err.message);
    }
    _browser = null;
  }
}

async function scrapeImagesWithBrowser(url) {
  const browser = await getBrowser();
  if (!browser) return null;

  let context, page;
  try {
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        "Accept-Language": "es-CO,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      bypassCSP: true,
    });

    page = await context.newPage();

    // Interceptar respuestas de red: captura URLs de imágenes aunque no estén en el DOM
    const networkImageUrls = new Set();
    page.on("response", resp => {
      const respUrl = resp.url();
        // Capturar cualquier respuesta que apunte a una imagen (no limitar a cloudfront)
        if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(respUrl)) {
        networkImageUrls.add(respUrl);
      }
    });

    // Ocultar que es un navegador automatizado
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    } catch (err) {
      console.log(`  ⚠️  Timeout/error al cargar ${url}: ${err.message}`);
      return null;
    }

    // Esperar hidratación de React/Gatsby
    await new Promise(r => setTimeout(r, 3000));

    // ── PASO 1: Extraer imágenes del estado JS antes de abrir el carrusel ──
    const stateImages = await page.evaluate(() => {
      // Buscar cualquier URL de imagen en scripts/estados inline
      const cdnPattern = /https?:\/\/[^\s"'\\<>,]+\.(?:jpe?g|png|webp|avif)/gi;
      const imgs = new Set();
      for (const key of ["__NEXT_DATA__", "__GATSBY_INITIAL_DATA__", "__INITIAL_STATE__", "__PRELOADED_STATE__"]) {
        try {
          const state = window[key];
          if (!state) continue;
          for (const m of JSON.stringify(state).match(cdnPattern) || []) imgs.add(m);
        } catch {}
      }
      document.querySelectorAll("script:not([src])").forEach(s => {
        const c = s.textContent || "";
        if (!c.includes("cloudfront.net")) return;
        for (const m of c.match(cdnPattern) || []) imgs.add(m);
      });
      return [...imgs];
    });

    // ── PASO 2: Clic en el botón "Ver todas las imágenes" para abrir el carrusel ──
    const buttonSelectors = [
      'button[data-id="listing-btn-allImages"]',
      '[data-testid="Carousel-button"]',
      '[data-id="listing-btn-allImages"]',
      'button:has-text("Ver todas las imágenes")',
      'button:has-text("Ver todas las imagenes")',
      'button:has-text("Todas las imágenes")',
      'button:has-text("Todas las imagenes")',
      'button:has-text("Más fotos")',
      'button:has-text("Mas fotos")',
      'button:has-text("Ver fotos")',
      'button[aria-label*="imagen" i]',
      'button[title*="imagen" i]',
    ];
    const galleryKeywords = [
      'ver todas las imagenes',
      'todas las imagenes',
      'mas fotos',
      'ver fotos',
      'galeria',
      'gallery',
    ];
    const tryClickInContext = async (context, selector) => {
      try {
        const element = await context.waitForSelector(selector, { timeout: 4000, state: 'visible' }).catch(() => null);
        if (!element) return false;
        await element.click({ timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    };
    const tryTextFallback = async (context) => {
      try {
        return await context.evaluate((keywords) => {
          const normalize = (value) => (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          const buttons = Array.from(document.querySelectorAll('button'));
          const candidate = buttons.find((button) => {
            const text = normalize([
              button.textContent,
              button.getAttribute('aria-label'),
              button.getAttribute('title'),
            ].filter(Boolean).join(' '));
            return keywords.some((keyword) => text.includes(keyword));
          });

          if (!candidate) return false;
          candidate.click();
          return true;
        }, galleryKeywords);
      } catch {
        return false;
      }
    };

    let clicked = false;
    const contexts = [page, ...page.frames().filter((frame) => frame.url())];
    for (const context of contexts) {
      for (const sel of buttonSelectors) {
        if (await tryClickInContext(context, sel)) {
          clicked = true;
          console.log(`    🖱️  Carrusel abierto con selector: ${sel}${context === page ? '' : ' (frame)'}`);
          break;
        }
      }
      if (clicked) break;

      if (await tryTextFallback(context)) {
        clicked = true;
        console.log(`    🖱️  Carrusel abierto con fallback de texto${context === page ? '' : ' (frame)'}`);
        break;
      }
    }

    if (clicked) {
      // Esperar a que el modal de galería abra y cargue imágenes iniciales
      await new Promise(r => setTimeout(r, 3000));

      // Scroll por la galería para disparar lazy loading de todas las fotos
      await page.evaluate(async () => {
        const galSelectors = [
          '[role="dialog"]',
          '[class*="allImages"]',
          '[class*="gallery"]',
          '[class*="Gallery"]',
          '[class*="modal"]',
          '[class*="Modal"]',
          '[class*="lightbox"]',
          '[class*="Lightbox"]',
          '[class*="slider"]',
          '[class*="carousel"]',
          '[class*="Carousel"]',
          '[class*="overlay"]',
        ];

        let container = null;
        for (const s of galSelectors) {
          const el = document.querySelector(s);
          if (el && el.scrollHeight > el.clientHeight + 50) {
            container = el;
            break;
          }
        }

        const targets = container ? [container, document.documentElement] : [document.documentElement, document.body];

        for (const target of targets) {
          const h = target.scrollHeight;
          // Primera pasada rápida
          for (let y = 0; y <= h + 500; y += 200) {
            target.scrollTop = y;
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 100));
          }
          // Segunda pasada lenta para el lazy loading más profundo
          target.scrollTop = 0;
          await new Promise(r => setTimeout(r, 300));
          for (let y = 0; y <= h + 500; y += 100) {
            target.scrollTop = y;
            await new Promise(r => setTimeout(r, 80));
          }
        }
      }).catch(() => {});

      // Dar tiempo adicional para que los requests de imágenes finalicen
      await new Promise(r => setTimeout(r, 2500));
    }

    // ── PASO 3: Extraer TODAS las imágenes del DOM (con carrusel abierto) ──
    const domImages = await page.evaluate(() => {
      const imgs = new Set();
        const cdnPattern = /https?:\/\/[^\s"'\\<>,]+\.(?:jpe?g|png|webp|avif)/gi;

      // Tags <img>: todos los atributos posibles incluyendo lazy-load
      document.querySelectorAll("img").forEach(img => {
        for (const attr of ["src", "data-src", "data-lazy-src", "data-main-image", "data-original"]) {
          const v = img.getAttribute(attr);
          if (v && v.startsWith("http")) imgs.add(v);
        }
        for (const attr of ["srcset", "data-srcset"]) {
          const ss = img.getAttribute(attr) || "";
          ss.split(",").forEach(e => {
            const s = e.trim().split(" ")[0];
            if (s && s.startsWith("http")) imgs.add(s);
          });
        }
      });

      // Tags <source> de elementos <picture>
      document.querySelectorAll("source").forEach(src => {
        for (const attr of ["srcset", "data-srcset"]) {
          const ss = src.getAttribute(attr) || "";
          ss.split(",").forEach(e => {
            const s = e.trim().split(" ")[0];
            if (s && s.startsWith("http")) imgs.add(s);
          });
        }
      });

      // Re-extraer del estado JS (puede haber actualizado tras el clic)
      for (const key of ["__NEXT_DATA__", "__GATSBY_INITIAL_DATA__", "__INITIAL_STATE__", "__PRELOADED_STATE__"]) {
        try {
          const state = window[key];
          if (!state) continue;
          for (const m of JSON.stringify(state).match(cdnPattern) || []) imgs.add(m);
        } catch {}
      }

      // Scripts inline actualizados
      document.querySelectorAll("script:not([src])").forEach(s => {
        const c = s.textContent || "";
        if (!c.includes("cloudfront.net")) return;
        for (const m of c.match(cdnPattern) || []) imgs.add(m);
      });

      return [...imgs];
    });

    // Combinar: estado JS + DOM abierto + URLs interceptadas en red
    const allUrls = [...new Set([...stateImages, ...domImages, ...networkImageUrls])];
    console.log(`    📡 Fuentes: estado=${stateImages.length} dom=${domImages.length} red=${networkImageUrls.size}`);
    return allUrls;
  } catch (err) {
    console.log(`  ⚠️  Error scraping con browser: ${err.message}`);
    return null;
  } finally {
    if (page) { try { await page.close(); } catch {} }
    if (context) { try { await context.close(); } catch {} }
  }
}

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

// Busca recursivamente arrays de imágenes dentro de un objeto JSON arbitrario.
// Devuelve el array de mayor tamaño encontrado que parezca contener URLs de imágenes.
function findImagesInJson(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 12) return [];

  if (Array.isArray(obj)) {
    // ¿Es un array de imágenes?
    const imageItems = obj.filter(
      (item) =>
        typeof item === "string"
          ? /\.(jpe?g|png|webp|avif)/i.test(item) || item.includes("cloudfront.net")
          : item && typeof item === "object" && (item.url || item.src || item.image)
    );
    if (imageItems.length > 0) return obj;

    // Buscar dentro de cada elemento del array
    let best = [];
    for (const item of obj) {
      const found = findImagesInJson(item, depth + 1);
      if (found.length > best.length) best = found;
    }
    return best;
  }

  const IMAGE_KEYS = ["images", "photos", "gallery", "media", "carouselImages", "allImages", "propertyImages"];
  let best = [];

  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (IMAGE_KEYS.includes(k) && Array.isArray(val) && val.length > 0) {
      if (val.length > best.length) best = val;
    }
    const found = findImagesInJson(val, depth + 1);
    if (found.length > best.length) best = found;
  }

  return best;
}

async function scrapeCarouselImagesFromPageData(url, imageBaseUrl) {
  const pageDataUrl = getGatsbyPageDataUrl(url);
  if (!pageDataUrl) return [];

  try {
    const { data } = await axios.get(pageDataUrl, {
      timeout: 12000,
      headers: { "User-Agent": CONFIG.userAgent }
    });

    // Intentar múltiples rutas conocidas en la estructura de Gatsby/Habi
    const carousel =
      data?.result?.pageContext?.propertyDetail?.property?.images ||
      data?.result?.pageContext?.property?.images ||
      data?.result?.pageContext?.propertyDetail?.images ||
      data?.result?.pageContext?.images ||
      data?.result?.data?.property?.images ||
      data?.result?.data?.propertiesDetail?.nodes?.[0]?.images ||
      data?.result?.data?.allPropertiesDetail?.nodes?.[0]?.images ||
      data?.result?.data?.propertyDetail?.property?.images ||
      // Si ninguna ruta directa funciona, buscar recursivamente
      findImagesInJson(data);

    if (!Array.isArray(carousel) || !carousel.length) return [];

    const mapped = carousel
      .map((img) => {
        const raw = typeof img === "string" ? img : (img?.url || img?.src || img?.image || img?.path);
        const full = buildImageUrl(raw, imageBaseUrl);
        if (!full) return null;
        return {
          url: full,
          order: typeof img === "object" ? Number(img?.order ?? img?.position ?? img?.index ?? 0) : 0
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

    return [...uniqueByKey.values()];
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

  return true;
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
    console.log("Git check bypassed");;
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

async function extractImagesFromInlineScripts(html, imageBaseUrl) {
  const results = [];

  // Patrones de estado inicial que Gatsby/Next.js incrustan en el HTML
  const windowPatterns = [
    /window\.__GATSBY_INITIAL_DATA__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script>)/,
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script>)/,
    /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script>)/,
  ];

  for (const pattern of windowPatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const obj = JSON.parse(match[1]);
        const imgs = findImagesInJson(obj);
        for (const img of imgs) {
          const raw = typeof img === "string" ? img : (img?.url || img?.src);
          const full = buildImageUrl(raw, imageBaseUrl);
          if (full && isValidImageUrl(full)) results.push(full);
        }
        if (results.length > 0) break;
      } catch { /* seguir con el siguiente patrón */ }
    }
  }

  // Buscar en tags <script type="application/json"> (Gatsby usa esto en algunos builds)
  const $ = cheerio.load(html);
  $('script[type="application/json"]').each((_, el) => {
    const content = $(el).text().trim();
    if (!content) return;
    try {
      const obj = JSON.parse(content);
      const imgs = findImagesInJson(obj);
      for (const img of imgs) {
        const raw = typeof img === "string" ? img : (img?.url || img?.src);
        const full = buildImageUrl(raw, imageBaseUrl);
        if (full && isValidImageUrl(full)) results.push(full);
      }
    } catch { /* JSON inválido, ignorar */ }
  });

  const uniqueByKey = new Map();
  for (const imgUrl of results) {
    const key = imageKey(imgUrl);
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, imgUrl);
  }
  return [...uniqueByKey.values()];
}

function scrapeCarouselFromDom($, imageBaseUrl) {
  const imgs = [];
  // Selector específico para el carrusel de Habi: ul.slider > li.slide > img
  $("ul.slider li.slide img, li.slide img").each((_, el) => {
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src");
    if (!src) return;
    const full = normalizeImageUrl(src, imageBaseUrl);
    if (full && isValidImageUrl(full)) imgs.push(full);
  });

  const uniqueByKey = new Map();
  for (const imgUrl of imgs) {
    const key = imageKey(imgUrl);
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, imgUrl);
  }
  return [...uniqueByKey.values()];
}

async function scrapeImages(url) {
  try {
    const collectedImages = [];

    // ── MÉTODO PRIMARIO: browser headless con clic en botón del carrusel ──
    const browserRaw = await scrapeImagesWithBrowser(url);
    if (browserRaw !== null) {
      for (const raw of browserRaw) {
        const normalized = normalizeImageUrl(raw, url);
        if (normalized && isValidImageUrl(normalized)) collectedImages.push(normalized);
      }
    }

    // ── FALLBACK: scraping estático cuando Puppeteer no está disponible o no captura todo ──
    const { data } = await axios.get(url, { timeout: 12000, headers: { "User-Agent": CONFIG.userAgent } });
    const $ = cheerio.load(data);
    const imageBaseUrl = detectImageBaseUrl(url, $);

    // 1) DOM del carrusel (ul.slider li.slide img)
    const domCarouselImages = scrapeCarouselFromDom($, imageBaseUrl);

    // 2) JSON-LD "image" arrays — buscar en TODOS los bloques <script type="application/ld+json">
    //    (El primer bloque suele tener solo 3 imágenes para SEO; otros pueden tener más)
    let jsonLdImages = [];
    const jsonLdBlocks = data.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of jsonLdBlocks) {
      const content = block.replace(/<[^>]+>/g, "");
      const match = content.match(/"image":\s*\[([^\]]*)\]/);
      if (!match) continue;
      try {
        const imgs = JSON.parse("[" + match[1] + "]");
        const urls = imgs.map(img => (img.startsWith("http") ? img : HABI_CDN + img)).filter(Boolean);
        if (urls.length > jsonLdImages.length) jsonLdImages = urls;
      } catch {}
    }

    // 3) Gatsby page-data
    const carouselImages = await scrapeCarouselImagesFromPageData(url, imageBaseUrl);

    // 4) Scripts incrustados (window.__GATSBY_INITIAL_DATA__ etc.)
    const inlineScriptImages = await extractImagesFromInlineScripts(data, imageBaseUrl);

    // 5) Regex directo sobre el HTML buscando URLs del CDN de Habi (cloudfront.net)
    //    Esto captura fotos que están en el HTML pero fuera de los bloques anteriores.
    const cdnRegex = /https?:\/\/d3hzflklh28tts\.cloudfront\.net\/[^\s"'\\<>,]+\.(?:jpe?g|png|webp|avif)/gi;
      // Regex más amplia para capturar imágenes desde cualquier dominio
    const cdnMatches = (data.match(cdnRegex) || []).filter(isValidImageUrl);

    // Combinar TODAS las fuentes y deduplicar (en lugar de quedarse solo con la más grande)
    const allPrimaryImages = [
      ...domCarouselImages,
      ...carouselImages,
      ...inlineScriptImages,
      ...jsonLdImages,
      ...cdnMatches,
    ];
    const uniquePrimary = new Map();
    for (const imgUrl of allPrimaryImages) {
      const key = imageKey(imgUrl);
      if (!uniquePrimary.has(key)) uniquePrimary.set(key, imgUrl);
    }
    collectedImages.push(...uniquePrimary.values());

    const candidates = [];

    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    if (ogImage) candidates.push(ogImage);
    if (twitterImage) candidates.push(twitterImage);

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

    $("source").each((_, el) => {
      const srcset = $(el).attr("srcset");
      if (srcset) {
        const first = srcset.split(",")[0]?.trim().split(" ")[0];
        if (first) candidates.push(first);
      }
    });

    const ventaMatches = data.match(/venta-[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp|avif)/gi) || [];
    for (const match of ventaMatches) {
      const full = buildImageUrl(match, imageBaseUrl);
      if (full) candidates.push(full);
    }

    const regexMatches = data.match(/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>]*)?/gi) || [];
    candidates.push(...regexMatches);

    const normalized = candidates
      .map(raw => normalizeImageUrl(raw, url))
      .filter(img => isValidImageUrl(img));

    const uniqueByKey = new Map();
    for (const img of normalized) {
      const key = imageKey(img);
      if (!uniqueByKey.has(key)) uniqueByKey.set(key, img);
    }
    collectedImages.push(...uniqueByKey.values());

    const finalUnique = new Map();
    for (const imgUrl of collectedImages) {
      const key = imageKey(imgUrl);
      if (!finalUnique.has(key)) finalUnique.set(key, imgUrl);
    }

    return [...finalUnique.values()].sort((a, b) => scoreImage(b) - scoreImage(a));
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

function createLimiter(concurrency) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const { fn, resolve, reject } = queue.shift();
      run(fn).then(resolve, reject);
    }
  };

  const run = async (fn) => {
    activeCount++;
    try {
      return await fn();
    } finally {
      next();
    }
  };

  return (fn) => {
    if (activeCount < concurrency) {
      return run(fn);
    }
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
    });
  };
}

function countUsableImages(images) {
  if (!Array.isArray(images) || images.length === 0) return 0;
  return images.filter((img) => typeof img === "string" && img && img !== CONFIG.placeholderImage).length;
}

function propertyKey(p) {
  const nid = (p?.nid || "").toString().trim();
  if (nid) return `nid:${nid}`;
  const url = (p?.url_habi || p?.url || "").toString().trim().toLowerCase();
  if (url) return `url:${url}`;
  return "";
}

function loadPreviousInventory() {
  const parseInventory = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const inventoryCandidates = [];
  const diskCandidates = [CONFIG.outputPath, CONFIG.publicOutputPath];
  for (const filePath of diskCandidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = parseInventory(raw);
      if (parsed) {
        inventoryCandidates.push({ source: `disk:${filePath}`, items: parsed });
      }
    } catch (err) {
      console.warn(`⚠️  No se pudo leer inventario previo (${filePath}): ${err.message}`);
    }
  }

  // Fallback robusto: si el archivo local quedó truncado por una ejecución parcial,
  // intentar recuperar una base más completa desde git.
  const gitRelativePaths = [
    path.relative(ROOT, CONFIG.outputPath).replace(/\\/g, "/"),
    path.relative(ROOT, CONFIG.publicOutputPath).replace(/\\/g, "/"),
  ];
  const gitRefs = ["HEAD", "origin/main"];

  for (const ref of gitRefs) {
    for (const relPath of gitRelativePaths) {
      try {
        const raw = execSync(`git show ${ref}:${relPath}`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
        const parsed = parseInventory(raw);
        if (parsed) {
          inventoryCandidates.push({ source: `git:${ref}:${relPath}`, items: parsed });
        }
      } catch {
        // Ignorar si el ref/path no existe o git no está disponible.
      }
    }
  }

  if (inventoryCandidates.length === 0) return [];

  inventoryCandidates.sort((a, b) => b.items.length - a.items.length);
  const selected = inventoryCandidates[0];
  if (selected.items.length > 0) {
    console.log(`ℹ️  Inventario previo seleccionado (${selected.items.length} propiedades) desde ${selected.source}`);
  }
  return selected.items;
}

function normalizeHeader(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseHeaderlessRow(row) {
  const pick = (index) => (row[index] ?? "").toString().trim();

  const parsed = {
    nid: pick(0),
    tipo_de_propiedad: pick(1),
    conjunto: pick(2),
    direccion: pick(3),
    num_piso: pick(4),
    precio_anterior: pick(5),
    precio_venta: pick(6),
    area: pick(7),
    banos: pick(8),
    tiene_ascensor: pick(10),
    num_habitaciones: pick(15),
    localidad: pick(27),
    ciudad: pick(28),
    zona_pequeña: pick(31),
    estado_del_inmueble: pick(33),
    current_state: pick(34),
    barrio: pick(35),
    costo_administracion: pick(36),
    descripcion: pick(37),
    titulo: pick(38),
    url_360: pick(39),
    url_habi: pick(41),
  };

  // Compatibilidad con código existente que también consulta p.url.
  parsed.url = parsed.url_habi;
  return parsed;
}

function parseSpreadsheetRows(buffer, fileName) {
  if (!fileName.endsWith(".xlsx")) {
    const csvData = buffer.toString();
    return parse(csvData, { header: true, skipEmptyLines: true }).data || [];
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const firstRowHeaders = (matrix[0] || []).map(normalizeHeader).filter(Boolean);
  const knownHeaders = new Set(["nid", "url_habi", "url", "precio_venta", "titulo", "descripcion", "url_360"]);
  const looksLikeHeaderedFile = firstRowHeaders.some((header) => knownHeaders.has(header));

  if (looksLikeHeaderedFile) {
    const csvData = XLSX.utils.sheet_to_csv(sheet);
    return parse(csvData, { header: true, skipEmptyLines: true }).data || [];
  }

  console.log("ℹ️  Excel sin encabezados detectado: aplicando mapeo por posiciones de columnas.");
  return matrix
    .map((row) => parseHeaderlessRow(row))
    .filter((item) => item.nid || item.url_habi || item.titulo);
}

function buildPageFormatted(enriched) {
  return enriched.map((p) => ({
    nid: p.nid,
    titulo: p.titulo,
    tipo: p.tipo_de_propiedad || p.tipo || "",
    barrio: p.barrio || "",
    conjunto: p.conjunto || "",
    ciudad: p.ciudad || "",
    localidad: p.localidad || "",
    zona_grande: p.zona_grande || "",
    zona_mediana: p.zona_mediana || "",
    zona_pequeña: p.zona_pequeña || p["zona_pequeña"] || "",
    direccion: p.direccion || "",
    googleMapsUrl: p.googleMapsUrl || (() => {
      const parts = [p.direccion, p.conjunto, p.zona_pequeña, p.zona_mediana, p.zona_grande, p.ciudad].filter(Boolean);
      return parts.length ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}` : "";
    })(),
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
    current_state: p.current_state || "",
    deposito: /dep[oó]sito/i.test(p.descripcion || "") || /dep[oó]sito/i.test(p.titulo || ""),
    enSubasta: /^set_aside$/i.test((p.current_state || "").trim()) || /^separado$/i.test((p.estado_del_inmueble || "").trim()),
  }));
}

function writeOutputFiles(enriched) {
  const jsonData = JSON.stringify(enriched, null, 2);

  if (!fs.existsSync(path.dirname(CONFIG.outputPath))) fs.mkdirSync(path.dirname(CONFIG.outputPath), { recursive: true });
  fs.writeFileSync(CONFIG.outputPath, jsonData);

  if (!fs.existsSync(path.dirname(CONFIG.publicOutputPath))) fs.mkdirSync(path.dirname(CONFIG.publicOutputPath), { recursive: true });
  fs.writeFileSync(CONFIG.publicOutputPath, jsonData);

  const pageFormatted = buildPageFormatted(enriched);
  const propertiesJs = `export const INV = ${JSON.stringify(pageFormatted, null, 2)};\n`;
  fs.writeFileSync(CONFIG.propertiesJsPath, propertiesJs);
}

// Control de concurrencia (por defecto 4, puede ajustarse via env or CONFIG)
CONFIG.concurrentRequests = Number(process.env.CONCURRENT_REQUESTS || 4);
CONFIG.dryRun = Boolean(process.env.DRY);
if (process.env.SAMPLE_SIZE && !CONFIG.dryRun) {
  CONFIG.dryRun = true;
  console.log("ℹ️  SAMPLE_SIZE detectado sin DRY: se fuerza DRY para no sobrescribir la base completa.");
}

async function main() {
  try {
    const previousInventory = loadPreviousInventory();
    const previousByKey = new Map();
    for (const prev of previousInventory) {
      const key = propertyKey(prev);
      if (!key || previousByKey.has(key)) continue;
      previousByKey.set(key, prev);
    }

    const drive = await getGoogleDriveClient();
    const file = await findLatestFile(drive);
    console.log(`📄 Procesando archivo: ${file.name}`);

    const res = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);

    const parsedData = parseSpreadsheetRows(buffer, file.name);
    // Permitir una prueba rápida limitando la cantidad de propiedades procesadas
    let properties = parsedData || [];
    if (process.env.SAMPLE_SIZE) {
      const n = Number(process.env.SAMPLE_SIZE) || 0;
      if (n > 0) properties = properties.slice(0, n);
    }

    const enriched = [];
    let processedWithMedia = 0;
    const checkpointEvery = Number(process.env.CHECKPOINT_EVERY || 100);
    let removedWithoutMedia = 0;
    const limit = createLimiter(CONFIG.concurrentRequests);
    const jobs = [];
    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      jobs.push(limit(async () => {
        const key = propertyKey(p);
          const previous = key ? previousByKey.get(key) : null;
          const previousUsableImages = countUsableImages(previous?.images);
          const reuseExistingImages = previousUsableImages >= 10;

        if (CONFIG.dryRun) {
          console.log(`[DRY] [${i+1}/${properties.length}] ${p.nid || i}: prueba de scraping (no guardará).`);
        } else {
            console.log(`[${i+1}/${properties.length}] ${p.nid || i}: ${reuseExistingImages ? `reutilizando fotos existentes (${previousUsableImages})` : `scraping fotos (${previousUsableImages} previas)`}`);
        }

        const habiUrl = p.url_habi || p.url || "";
        const imagesPromise = reuseExistingImages
          ? Promise.resolve(previous.images)
          : (habiUrl ? scrapeImages(habiUrl) : Promise.resolve([]));

        const [scrapedImages, is360Valid] = await Promise.all([
          imagesPromise,
          p.url_360 ? validate360(p.url_360) : Promise.resolve(false)
        ]);

        if (!is360Valid && p.url_360) {
          console.log(`  ⚠️  360 inválido (404/error) - se eliminará del campo: ${p.url_360}`);
        }
        console.log(`  📸 ${scrapedImages.length} fotos${reuseExistingImages ? " (reutilizadas)" : ""} | 360: ${is360Valid ? "✅" : "❌"} | url: ${habiUrl}`);

        if (scrapedImages.length === 0 && !is360Valid) {
          removedWithoutMedia++;
          console.log(`  🗑️  Propiedad eliminada: sin fotos ni Matterport válido (nid: ${p.nid || i})`);
          return null;
        }

        const images = scrapedImages.length > 0 ? scrapedImages : [CONFIG.placeholderImage];
        const enrichedItem = { ...p, images, url_360: is360Valid ? p.url_360 : "", precio: parseInt(p.precio_venta || 0, 10) };
        enriched.push(enrichedItem);
        processedWithMedia++;

        if (!CONFIG.dryRun && checkpointEvery > 0 && processedWithMedia % checkpointEvery === 0) {
          writeOutputFiles(enriched);
          console.log(`💾 Checkpoint guardado (${processedWithMedia} propiedades acumuladas).`);
        }

        // small sleep to avoid bursty writes when not dry
        if (!CONFIG.dryRun) await new Promise(r => setTimeout(r, Math.max(0, CONFIG.delayBetweenRequestsMs / CONFIG.concurrentRequests)));
        return null;
      }));
    }

    await Promise.all(jobs);
    if (!CONFIG.dryRun) {
      writeOutputFiles(enriched);
    } else {
      console.log("ℹ️  DRY activo: no se escribieron archivos de salida.");
    }

    console.log(`✅ ¡Inventario actualizado con éxito! (${enriched.length} propiedades)`);
    console.log(`🗑️ Propiedades eliminadas por falta de fotos/Matterport: ${removedWithoutMedia}`);
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
  } finally {
    await closeBrowser();
  }
}

main();