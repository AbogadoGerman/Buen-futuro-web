export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ valid: false });
  }

  try {
    const oembedUrl = `https://my.matterport.com/api/v1/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)" },
    });

    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data?.html) return Response.json({ valid: true });
    }

    if (resp.status === 404 || resp.status === 403 || resp.status === 400) {
      return Response.json({ valid: false });
    }

    // Fallback: fetch the page and check for error indicators
    const pageResp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BuenFuturoBot/2.0)" },
    });
    if (!pageResp.ok) return Response.json({ valid: false });

    const html = await pageResp.text();
    const errorPatterns = [
      /not\s+available/i,
      /no\s+est[aá]\s+disponible/i,
      /"available"\s*:\s*false/i,
      /"published"\s*:\s*false/i,
      /model[_\s]not[_\s]found/i,
    ];
    if (errorPatterns.some((p) => p.test(html))) {
      return Response.json({ valid: false });
    }

    const valid = html.includes("showcase") && html.includes("matterport");
    return Response.json({ valid });
  } catch {
    return Response.json({ valid: false });
  }
}
