const crypto = require('crypto');

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

module.exports = async (req, res) => {
  // ---- CORS ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ---- Auth against YOUR personal key ----
  const provided =
    req.headers['x-api-key'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    req.query.key;

  const personalKey = process.env.PERSONAL_API_KEY;

  if (!personalKey) {
    return res.status(500).json({ error: 'Server misconfigured (missing PERSONAL_API_KEY)' });
  }
  if (!provided || !safeEqual(provided, personalKey)) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }

  // ---- Validate input ----
  const bank_code = String(req.query.bank_code || '').trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank_code)) {
    return res.status(400).json({ error: 'Invalid bank_code (e.g. SBIN0006867)' });
  }

  const upstreamKey = process.env.INDIANAPI_KEY;
  if (!upstreamKey) {
    return res.status(500).json({ error: 'Server misconfigured (missing INDIANAPI_KEY)' });
  }

  // ---- Proxy upstream ----
  try {
    const url = `https://ifsc.indianapi.in/ifsc?bank_code=${encodeURIComponent(bank_code)}`;
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'x-api-key': upstreamKey,
      },
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Upstream error',
        status: upstream.status,
        details: data,
      });
    }

    // Cache at Vercel edge for 24h (IFSC data is static)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Bad gateway', message: err.message });
  }
};