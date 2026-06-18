// api/session.js
// Devuelve quién es el usuario actual según la cookie de sesión.
// El frontend lo llama al cargar la página para saber si ya hay sesión activa
// (en vez de depender de localStorage, que no se comparte entre dispositivos).

const { obtenerSesionDesdeRequest } = require('../lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const sesion = await obtenerSesionDesdeRequest(req);
    if (!sesion) {
      res.status(200).json({ authenticated: false });
      return;
    }
    res.status(200).json({ authenticated: true, username: sesion.username, role: sesion.role });
  } catch (err) {
    console.error('Error en /api/session:', err);
    res.status(500).json({ error: 'Error interno del servidor', detalle: String(err && err.message || err) });
  }
};
