// Vercel Serverless Function: proxy image generation.
// Key is sent per-request in x-api-key, forwarded as Bearer, never stored.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  try {
    const apiKey = req.headers['x-api-key'];
    const { baseUrl, model, prompt, size } = req.body || {};
    if (!apiKey) return res.status(400).json({ error: 'Thiếu API key.' });
    if (!baseUrl || !prompt) return res.status(400).json({ error: 'Thiếu Base URL hoặc mô tả ảnh.' });
    const base = String(baseUrl).replace(/\/+$/, '');
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey };
    if (base.includes('xingchiapi.com')) headers['x-openai-actor-authorization'] = 'local-image-extension';

    // Try the standard images endpoint first (works for OpenAI / gpt-image-1 / dall-e-3).
    const url = base + '/images/generations';
    const r = await fetch(url, {
      method: 'POST', headers,
      body: JSON.stringify({ model: model || 'gpt-image-1', prompt, size: size || '1024x1024', n: 1 })
    });
    const text = await r.text();
    if (!r.ok) {
      let msg = text.slice(0, 500);
      try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
      return res.status(r.status).json({ error: msg });
    }
    const data = JSON.parse(text);
    const item = data.data?.[0] || {};
    if (item.b64_json) return res.status(200).json({ image: 'data:image/png;base64,' + item.b64_json });
    if (item.url) return res.status(200).json({ image: item.url });
    return res.status(502).json({ error: 'Máy chủ không trả về ảnh.' });
  } catch (e) {
    return res.status(500).json({ error: 'Không gọi được tới nhà cung cấp: ' + (e.message || e) });
  }
}
