// Vercel Serverless Function: proxy video generation (Sora-compatible /videos).
// Key is sent per-request in x-api-key, forwarded as Bearer, never stored.
// Note: many providers (including Xingchi) may not expose a video model.
// In that case the upstream error is returned honestly — no fake video is made.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  try {
    const apiKey = req.headers['x-api-key'];
    const { baseUrl, model, prompt, size } = req.body || {};
    if (!apiKey) return res.status(400).json({ error: 'Thiếu API key.' });
    if (!baseUrl || !prompt) return res.status(400).json({ error: 'Thiếu Base URL hoặc mô tả video.' });
    const base = String(baseUrl).replace(/\/+$/, '');
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey };
    if (base.includes('xingchiapi.com')) headers['x-openai-actor-authorization'] = 'local-image-extension';
    const r = await fetch(base + '/videos', {
      method: 'POST', headers,
      body: JSON.stringify({ model: model || 'sora-2', prompt, size: size || '1024x1024' })
    });
    const text = await r.text();
    if (!r.ok) {
      let msg = text.slice(0, 500);
      try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
      return res.status(r.status).json({ error: 'Nhà cung cấp chưa hỗ trợ tạo video (hoặc model video sai): ' + msg });
    }
    const data = JSON.parse(text);
    // Sora-style responses vary: completed video url, or a job to poll.
    const url = data.data?.[0]?.url || data.url || data.video_url || null;
    const id = data.id || data.job_id || null;
    const status = data.status || (url ? 'completed' : 'processing');
    return res.status(200).json({ url, id, status, raw: data });
  } catch (e) {
    return res.status(500).json({ error: 'Không gọi được tới nhà cung cấp: ' + (e.message || e) });
  }
}
