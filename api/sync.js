// Sincronización protegida con contraseña. Guarda los datos en Supabase.
// Variables de entorno (Vercel → Settings → Environment Variables):
//   SYNC_PASSWORD        contraseña que usan los dispositivos para sincronizar
//   SUPABASE_URL         https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY clave "service_role" de Supabase (solo vive en el servidor)
const crypto = require('crypto');

function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { SYNC_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SYNC_PASSWORD || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Faltan variables de entorno' });
  }
  const pass = req.headers['x-sync-password'];
  if (!pass || !same(pass, SYNC_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 700));
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const base = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/app_data';
  const headers = { apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' };
  if (SUPABASE_SERVICE_KEY.indexOf('eyJ') === 0) headers.Authorization = 'Bearer ' + SUPABASE_SERVICE_KEY;
  try {
    if (req.method === 'GET') {
      const r = await fetch(base + '?id=eq.golite&select=data', { headers });
      if (!r.ok) return res.status(502).json({ error: 'Supabase respondió ' + r.status });
      const rows = await r.json();
      return res.status(200).json(rows && rows[0] ? rows[0].data : null);
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Datos inválidos' });
      const r = await fetch(base + '?on_conflict=id', {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id: 'golite', data: body, updated_at: new Date().toISOString() }),
      });
      if (!r.ok) return res.status(502).json({ error: 'Supabase respondió ' + r.status });
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
};
