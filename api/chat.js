// Vercel Serverless Function: proxy chat to an OpenAI-compatible provider.
// The API key is sent by the browser in the x-api-key header for this request only.
// It is forwarded as Authorization: Bearer <key> and is never stored or logged here.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  try {
    const apiKey = req.headers['x-api-key'];
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { baseUrl, model, wireApi, messages, system, temperature } = bodyObj;
    if (!apiKey) return res.status(400).json({ error: 'Thiếu API key. Dán key vào Cài đặt trước.' });
    if (!baseUrl || !model) return res.status(400).json({ error: 'Thiếu Base URL hoặc model.' });
    const base = String(baseUrl).replace(/\/+$/, '');

    let url, body;
    if (wireApi === 'responses') {
      url = base + '/responses';
      const input = (messages || []).map(m => {
        if (m.role === 'user') return { role: 'user', content: m.content };
        if (m.role === 'assistant') return { role: 'assistant', content: m.content };
        return { role: m.role, content: m.content };
      });
      body = {
        model,
        instructions: system || undefined,
        input,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        store: false
      };
    } else {
      url = base + '/chat/completions';
      const msgs = [];
      if (system) msgs.push({ role: 'system', content: system });
      (messages || []).forEach(m => msgs.push({ role: m.role, content: m.content }));
      body = { model, messages: msgs, temperature: typeof temperature === 'number' ? temperature : 0.7 };
    }

    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey };
    // Xingchi's Codex config also sends this header; include it only for xingchiapi.com
    if (base.includes('xingchiapi.com')) headers['x-openai-actor-authorization'] = 'local-image-extension';

    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await r.text();
    if (!r.ok) {
      let msg = text.slice(0, 500);
      try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
      return res.status(r.status).json({ error: msg });
    }
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Nhà cung cấp trả về dữ liệu không phải JSON: ' + text.slice(0, 300) }); }

    let reply = '';
    if (wireApi === 'responses') {
      if (typeof data.output_text === 'string') reply = data.output_text;
      else if (Array.isArray(data.output)) {
        for (const item of data.output) {
          if (Array.isArray(item.content)) {
            for (const c of item.content) {
              if (typeof c.text === 'string') reply += c.text;
              if (typeof c.output_text === 'string') reply += c.output_text;
            }
          }
        }
      }
      if (!reply && data.response?.output_text) reply = data.response.output_text;
    } else {
      reply = data.choices?.[0]?.message?.content || '';
    }
    const usage = data.usage || null;
    return res.status(200).json({ reply, usage });
  } catch (e) {
    return res.status(500).json({ error: 'Không gọi được tới nhà cung cấp: ' + (e.message || e) });
  }
}
