// api/users.js
// CRUD de usuarios. Todas las operaciones de escritura requieren sesión
// activa con rol 'admin'. Las contraseñas nunca se devuelven al cliente.

const { obtenerSesionDesdeRequest } = require('../lib/session');
const {
  asegurarSeed,
  listarUsuariosPublico,
  crearUsuarioDB,
  cambiarRolDB,
  cambiarPasswordDB,
  eliminarUsuarioPublico
} = require('../lib/users');

async function requireAdmin(req, res) {
  const sesion = await obtenerSesionDesdeRequest(req);
  if (!sesion) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  if (sesion.role !== 'admin') {
    res.status(403).json({ error: 'Solo un administrador puede realizar esta acción' });
    return null;
  }
  return sesion;
}

module.exports = async function handler(req, res) {
  try {
    await asegurarSeed();

    if (req.method === 'GET') {
      // Listar usuarios requiere estar autenticado como admin (no se expone públicamente)
      const sesion = await requireAdmin(req, res);
      if (!sesion) return;
      const usuarios = await listarUsuariosPublico();
      res.status(200).json({ usuarios });
      return;
    }

    if (req.method === 'POST') {
      const sesion = await requireAdmin(req, res);
      if (!sesion) return;

      const { username, password, role } = req.body || {};
      if (!username || !password || !role) {
        res.status(400).json({ error: 'username, password y role son requeridos' });
        return;
      }
      await crearUsuarioDB(String(username).trim(), String(password), String(role));
      res.status(201).json({ ok: true });
      return;
    }

    if (req.method === 'PATCH') {
      const sesion = await requireAdmin(req, res);
      if (!sesion) return;

      const { username, role, password } = req.body || {};
      if (!username) {
        res.status(400).json({ error: 'username es requerido' });
        return;
      }
      if (role) {
        await cambiarRolDB(String(username).trim(), String(role));
      }
      if (password) {
        await cambiarPasswordDB(String(username).trim(), String(password));
      }
      if (!role && !password) {
        res.status(400).json({ error: 'Debes enviar role y/o password a actualizar' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const sesion = await requireAdmin(req, res);
      if (!sesion) return;

      const { username } = req.body || {};
      if (!username) {
        res.status(400).json({ error: 'username es requerido' });
        return;
      }
      await eliminarUsuarioPublico(String(username).trim());
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en /api/users:', err);
    res.status(400).json({ error: err.message || 'Error interno del servidor' });
  }
};
