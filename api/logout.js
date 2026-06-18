// api/logout.js
const { obtenerSesionDesdeRequest, destruirSesion, construirCookieClear } = require('../lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const sesion = await obtenerSesionDesdeRequest(req);
    if (sesion) {
      await destruirSesion(sesion.token);
    }
    res.setHeader('Set-Cookie', construirCookieClear());
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en /api/logout:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
