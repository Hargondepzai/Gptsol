// Vercel Serverless Function: test the key + Base URL by listing models.
export default async function handler(req, res) {
  try {
    const apiKey = req.headers['x-api-key'];
    const baseUrl = req.query.baseUrl || req.headers['x-base-url'];
    if (!apiKey) return res.status(400).json({ error: 'Thiếu API key.' });
    if (!baseUrl) return res.status(400).json({ error: 'Thiếu Base URL.' });
    const base = String(baseUrl).replace(/\/+$/, '');
    const headers = { Authorization: 'Bearer ' + apiKey };
    if (base.includes('xingchiapi.com')) headers['x-openai-actor-authorization'] = 'local-image-extension';
    const r = await fetch(base + '/models', { headers });
    const text = await r.text();
    if (!r.ok) {
      let msg = text.slice(0, 500);
      try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
      return res.status(r.status).json({ error: msg });
    }
    const data = JSON.parse(text);
    const models = (data.data || []).map(m => m.id).filter(Boolean);
    return res.status(200).json({ ok: true, models });
  } catch (e) {
    return res.status(500).json({ error: 'Không gọi được tới nhà cung cấp: ' + (e.message || e) });
  }
}
