export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { idea } = await req.json();
  if (!idea || idea.length < 3) return new Response(JSON.stringify({ error: 'Idea too short' }), { status: 400 });

  const prompt = `You are a brutally honest startup advisor. Analyze this idea and return a JSON object.

IDEA: "${idea}"

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "verdict": "startup" or "feature" or "maybe",
  "title": "One punchy sentence verdict (e.g. 'This is a startup.' or 'This is a feature of Slack.')",
  "summary": "2-3 sentences explaining why, referencing specific competitors or market dynamics",
  "score": number 0-80 (0=pure feature, 80=obvious startup),
  "criteria": [
    {"name": "Standalone value", "score": 1-10, "note": "one sentence why"},
    {"name": "Willingness to pay", "score": 1-10, "note": "one sentence why"},
    {"name": "Market size", "score": 1-10, "note": "one sentence why"},
    {"name": "Defensibility", "score": 1-10, "note": "one sentence why"},
    {"name": "Differentiation", "score": 1-10, "note": "one sentence why"},
    {"name": "Technical depth", "score": 1-10, "note": "one sentence why"},
    {"name": "Retention", "score": 1-10, "note": "one sentence why"},
    {"name": "Revenue clarity", "score": 1-10, "note": "one sentence why"}
  ],
  "similar": ["Product 1", "Product 2", "Product 3"],
  "advice": "2-3 sentences of actionable advice. Be specific. Reference real companies. Don't be generic."
}

Be honest and specific. If the idea is a feature, say of WHICH product. If it's a startup, say WHY it can stand alone. Reference real companies, real markets, real numbers when possible.`;

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'API error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    const text = data.content[0].text;

    // Parse JSON from response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Try extracting JSON from text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) analysis = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response');
    }

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/analyze' };
