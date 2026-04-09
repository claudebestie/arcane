export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { url } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL required' }), { status: 400 });

  let html = '';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PaletteExtractor/1.0)' },
      redirect: 'follow', signal: AbortSignal.timeout(8000)
    });
    html = await res.text();
  } catch (e) {
    return new Response(JSON.stringify({ error: `Could not fetch: ${e.message}` }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Extract colors from HTML + inline styles
  const colorSet = new Set();
  // Hex colors
  const hexMatches = html.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g) || [];
  hexMatches.forEach(c => colorSet.add(c.toLowerCase()));
  // RGB/RGBA
  const rgbMatches = html.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi) || [];
  rgbMatches.forEach(c => colorSet.add(c.replace(/\s/g, '')));
  // HSL
  const hslMatches = html.match(/hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/gi) || [];
  hslMatches.forEach(c => colorSet.add(c.replace(/\s/g, '')));
  // CSS custom properties with color values
  const varMatches = html.match(/--[\w-]+:\s*#[0-9a-fA-F]{3,8}/g) || [];
  varMatches.forEach(m => {
    const hex = m.match(/#[0-9a-fA-F]{3,8}/);
    if (hex) colorSet.add(hex[0].toLowerCase());
  });

  // Filter out common non-color hex (like font-size hex, etc)
  const colors = [...colorSet].filter(c => {
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      return hex.length === 3 || hex.length === 4 || hex.length === 6 || hex.length === 8;
    }
    return true;
  }).slice(0, 50);

  // Categorize with Claude
  const prompt = `Analyze these colors extracted from ${url} and return a JSON palette.

Colors found: ${JSON.stringify(colors)}

Return ONLY valid JSON:
{
  "palette": [
    {
      "hex": "#000000",
      "name": "Descriptive color name",
      "role": "primary" or "secondary" or "accent" or "background" or "text" or "border" or "neutral",
      "css_var": "CSS variable name if found, or null"
    }
  ],
  "primary_colors": ["#hex1", "#hex2"],
  "background_colors": ["#hex1"],
  "accent_colors": ["#hex1"],
  "text_colors": ["#hex1"],
  "summary": "Brief description of the color scheme — warm/cool, brand personality, design style",
  "css_code": "CSS custom properties code block with the main colors organized"
}

Deduplicate similar colors. Sort by importance (primary first). Max 12-15 colors in the palette. Be specific with color names (not just "blue" but "Electric Indigo" or "Soft Mint").`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ARCANE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-20250414', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error('AI error');
    const data = await res.json();
    let result;
    try { result = JSON.parse(data.content[0].text); } catch {
      const m = data.content[0].text.match(/\{[\s\S]*\}/);
      if (m) result = JSON.parse(m[0]); else throw new Error('Parse error');
    }
    result.raw_count = colors.length;
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
