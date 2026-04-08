export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { url } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL required' }), { status: 400 });

  // Fetch the page HTML + headers
  let html = '', headers = {};
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StackDetector/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    html = await res.text();
    headers = Object.fromEntries(res.headers.entries());
  } catch (e) {
    return new Response(JSON.stringify({ error: `Could not fetch: ${e.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Send HTML snippet + headers to Claude for analysis
  const htmlSnippet = html.substring(0, 12000);
  const headerStr = JSON.stringify(headers, null, 2).substring(0, 2000);

  const prompt = `You are a tech stack detective. Analyze this website's HTML and HTTP headers to detect every technology used.

URL: ${url}

HTTP HEADERS (first 2000 chars):
${headerStr}

HTML (first 12000 chars):
${htmlSnippet}

Return ONLY valid JSON (no markdown, no backticks) with this structure:
{
  "technologies": [
    {
      "name": "Technology Name",
      "category": "one of: Framework, CMS, CSS, JavaScript, Analytics, Hosting, CDN, Chat, Payment, Email, Auth, Database, Monitoring, Ads, Font, Other",
      "confidence": "high" or "medium" or "low",
      "evidence": "brief explanation of how you detected it",
      "monthly_cost": "$X/mo" or "Free" or "Usage-based",
      "icon": "one emoji that represents this technology"
    }
  ],
  "total_estimated_cost": "$X - $Y/mo",
  "summary": "One paragraph about this site's tech choices — what's good, what's unusual, what could be improved"
}

Be thorough. Look for: meta generators, script src patterns, link href patterns, class naming conventions (tailwind, bootstrap), headers (x-powered-by, server, x-vercel, cf-ray), inline scripts (gtag, fbq, hotjar, intercom, crisp, drift), font providers, payment SDKs, auth providers.
Detect at least 5-15 technologies if possible. Be specific (e.g. "Next.js 14" not just "React").`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'AI error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    const text = data.content[0].text;
    let result;
    try { result = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else throw new Error('Parse error');
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/detect' };
