export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { prompt } = await req.json();
  if (!prompt) return new Response(JSON.stringify({ error: 'Prompt required' }), { status: 400 });

  // Ask Claude to generate search queries + moodboard structure
  const aiPrompt = `You are a creative director. Based on this project brief, generate a moodboard.

BRIEF: "${prompt}"

Return ONLY valid JSON:
{
  "title": "Moodboard title (3-5 words)",
  "vibe": "One sentence describing the visual direction",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "color_names": ["Color Name 1", "Color Name 2", "Color Name 3", "Color Name 4", "Color Name 5"],
  "typography_suggestion": "Font pairing suggestion (e.g. 'Playfair Display + Inter')",
  "keywords": ["search term 1", "search term 2", "search term 3", "search term 4", "search term 5", "search term 6", "search term 7", "search term 8"],
  "sections": [
    {"label": "Mood", "description": "Brief description of the overall mood"},
    {"label": "Textures", "description": "Materials and textures that fit"},
    {"label": "Typography", "description": "Type style direction"},
    {"label": "Layout", "description": "Composition and spacing style"}
  ],
  "style_notes": "2-3 sentences of creative direction — what this brand should feel like"
}

Make the keywords specific and visual — good for Unsplash image search. Think textures, moods, architecture, nature, objects. Not generic.`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ARCANE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: aiPrompt }] })
    });
    if (!aiRes.ok) throw new Error('AI error');
    const aiData = await aiRes.json();
    let board;
    try { board = JSON.parse(aiData.content[0].text); } catch {
      const m = aiData.content[0].text.match(/\{[\s\S]*\}/);
      if (m) board = JSON.parse(m[0]); else throw new Error('Parse error');
    }

    // Generate images with Pollinations AI (free, no API key)
    const images = [];
    for (const kw of (board.keywords || []).slice(0, 5)) {
      const prompt = encodeURIComponent(`${kw}, professional photography, moodboard style, high quality, 4k`);
      images.push({
        url: `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true&seed=${Date.now() + images.length}`,
        thumb: `https://image.pollinations.ai/prompt/${prompt}?width=400&height=300&nologo=true&seed=${Date.now() + images.length}`,
        credit: 'AI Generated',
        keyword: kw
      });
    }
    board.images = images;

    return new Response(JSON.stringify(board), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
