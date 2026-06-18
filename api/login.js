// api/login.js
const { asegurarSeed, verificarCredenciales } = require('../lib/users');
const { crearSesion, construirCookieSet } = require('../lib/session');

const SESSION_TTL_SECONDS = 60 * 60 * 8;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    await asegurarSeed();

    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      return;
    }

    const resultado = await verificarCredenciales(String(username).trim(), String(password));
    if (!resultado) {
      // Mensaje genérico a propósito: no revelar si el usuario existe o no.
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const token = await crearSesion(resultado.username, resultado.role);
    res.setHeader('Set-Cookie', construirCookieSet(token, SESSION_TTL_SECONDS));
    res.status(200).json({ username: resultado.username, role: resultado.role });
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
