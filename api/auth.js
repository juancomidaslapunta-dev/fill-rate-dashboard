// api/auth.js
// Autenticación sin base de datos externa.
// Usuarios guardados en variable de entorno FILLRATE_USERS (JSON).
// Sesiones en memoria del proceso (válidas mientras el serverless container vive).
// Para proyecto con pocos usuarios y acceso controlado: suficiente.

const crypto = require('crypto');

// ── helpers ──────────────────────────────────────────────────────────────────

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Body parser manual — en Vercel sin framework, req.body puede ser undefined
// si el runtime no inyecta los helpers automáticamente.
async function parseBody(req) {
  // Si ya está parseado como objeto (helpers de Vercel activos), usarlo directamente
  if (req.body && typeof req.body === 'object') return req.body;
  // Si es string, intentar parsear como JSON
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  // Leer el stream crudo
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// Sesiones en memoria del proceso serverless (se pierden al reciclar el container,
// que ocurre cada ~5-10 min de inactividad → el usuario debe loguearse de nuevo).
// Esto es CORRECTO para este caso de uso: sin Redis, sin base de datos.
const SESSIONS = {};

// ── usuarios ─────────────────────────────────────────────────────────────────

function cargarUsuarios() {
  const raw = process.env.FILLRATE_USERS;
  if (!raw) {
    // Usuarios por defecto si la variable no está configurada: todos con 123456
    return {
      admin:  { hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'admin' },
      editor: { hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'editor' },
      lector: { hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'lector' }
    };
  }
  try {
    return JSON.parse(raw);
  } catch(e) {
    console.error('FILLRATE_USERS env var tiene JSON inválido:', e.message);
    return {
      admin: { hash: sha256('admin123'), role: 'admin' }
    };
  }
}

// ── cookie helpers ────────────────────────────────────────────────────────────

const COOKIE = 'fr_sid';

function leerCookie(req) {
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp(COOKIE + '=([^;]+)'));
  return m ? m[1] : null;
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax`
  );
}

function clearCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  );
}

// ── handler principal ─────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Parsear body manualmente (Vercel sin framework puede no auto-parsear JSON)
  const body = await parseBody(req);
  const action = (body && body.action) || req.query.action;

  res.setHeader('Content-Type', 'application/json');

  try {

    // ── LOGIN ──────────────────────────────────────────────────────────────
    if (action === 'login') {
      const { username, password } = body || {};
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      }

      const users = cargarUsuarios();
      const user  = users[username];
      if (!user || user.hash !== sha256(password)) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      const token = generarToken();
      SESSIONS[token] = { username, role: user.role, ts: Date.now() };
      setCookie(res, token);
      return res.status(200).json({ username, role: user.role });
    }

    // ── SESSION CHECK ──────────────────────────────────────────────────────
    if (action === 'session' || req.method === 'GET' && !action) {
      const token = leerCookie(req);
      const sesion = token && SESSIONS[token];
      if (!sesion) return res.status(200).json({ authenticated: false });
      return res.status(200).json({ authenticated: true, username: sesion.username, role: sesion.role });
    }

    // ── LOGOUT ─────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const token = leerCookie(req);
      if (token) delete SESSIONS[token];
      clearCookie(res);
      return res.status(200).json({ ok: true });
    }

    // ── LISTAR USUARIOS (solo admin) ───────────────────────────────────────
    if (action === 'list_users') {
      const token  = leerCookie(req);
      const sesion = token && SESSIONS[token];
      if (!sesion || sesion.role !== 'admin') {
        return res.status(403).json({ error: 'Solo admin puede listar usuarios' });
      }
      const users = cargarUsuarios();
      const lista = Object.entries(users).map(([u, d]) => ({ username: u, role: d.role }));
      return res.status(200).json({ usuarios: lista });
    }

    // ── INSTRUCCIONES CAMBIO DE USUARIO (solo admin) ───────────────────────
    // NOTA: agregar/cambiar/eliminar usuarios requiere actualizar la variable
    // FILLRATE_USERS en Vercel (Settings → Environment Variables) y redesplegar.
    // El panel de admin en el frontend genera el JSON correcto para pegar ahí.
    if (action === 'generate_users_json') {
      const token  = leerCookie(req);
      const sesion = token && SESSIONS[token];
      if (!sesion || sesion.role !== 'admin') {
        return res.status(403).json({ error: 'Solo admin' });
      }
      const users = cargarUsuarios();
      return res.status(200).json({ json: JSON.stringify(users), usuarios: Object.entries(users).map(([u,d]) => ({ username: u, role: d.role })) });
    }

    return res.status(400).json({ error: 'Acción no reconocida: ' + action });

  } catch(err) {
    console.error('[api/auth] error:', err);
    return res.status(500).json({ error: 'Error interno', detalle: String(err.message || err) });
  }
};
