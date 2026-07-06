// api/auth.js v4
// - Usuarios leídos de users.json (en el repo, servido como archivo estático)
// - Cuando admin crea/edita/elimina usuario → actualiza users.json vía GitHub API
//   → Vercel redespliega automáticamente (~30s) y el cambio aplica en todo dispositivo
// - Sesiones en memoria del proceso serverless
// - Sin dependencias npm (solo Node.js built-ins + fetch nativo)

const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');

// ── helpers ───────────────────────────────────────────────────────────────────

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── body parser ───────────────────────────────────────────────────────────────

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// ── cargar usuarios ───────────────────────────────────────────────────────────

function cargarUsuarios() {
  // Primero intentar desde FILLRATE_USERS (env var, tiene prioridad)
  const raw = process.env.FILLRATE_USERS;
  if (raw) {
    try { return JSON.parse(raw); } catch(e) {}
  }
  // Luego leer desde users.json en el directorio raíz del proyecto
  try {
    const filePath = path.join(process.cwd(), 'users.json');
    const content  = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch(e) {}
  // Fallback hardcodeado (admin/editor/lector con 123456)
  const h = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  return {
    admin:  { hash: h, role: 'admin' },
    editor: { hash: h, role: 'editor' },
    lector: { hash: h, role: 'lector' }
  };
}

// ── guardar usuarios vía GitHub API ──────────────────────────────────────────

async function guardarUsuariosGitHub(users) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO || 'juancomidaslapunta-dev/fill-rate-dashboard';

  if (!token) {
    throw new Error('GITHUB_TOKEN no configurado. Agrégala en Vercel → Settings → Environment Variables');
  }

  const content = JSON.stringify(users, null, 2);
  const encoded = Buffer.from(content).toString('base64');

  // Obtener SHA actual del archivo para poder actualizarlo
  const getResp = await fetch(`https://api.github.com/repos/${repo}/contents/users.json`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json'
    }
  });

  let sha = null;
  if (getResp.ok) {
    const data = await getResp.json();
    sha = data.sha;
  }

  // Actualizar (o crear si no existe)
  const body = {
    message: 'chore: actualizar usuarios desde panel admin',
    content: encoded,
    ...(sha ? { sha } : {})
  };

  const putResp = await fetch(`https://api.github.com/repos/${repo}/contents/users.json`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putResp.ok) {
    const err = await putResp.json().catch(() => ({}));
    throw new Error('GitHub API error: ' + (err.message || putResp.status));
  }

  return true;
}

// ── sesiones ──────────────────────────────────────────────────────────────────

const SESSIONS = {};

const COOKIE = 'fr_sid';

function leerCookie(req) {
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp(COOKIE + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax`);
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

// ── handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const body   = await parseBody(req);
  const action = (body && body.action) || (req.query && req.query.action);

  res.setHeader('Content-Type', 'application/json');

  try {

    // LOGIN
    if (action === 'login') {
      const { username, password } = body || {};
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      }
      const users = cargarUsuarios();
      const user  = users[String(username).trim()];
      if (!user || user.hash !== sha256(String(password))) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      const token = generarToken();
      SESSIONS[token] = { username: String(username).trim(), role: user.role, ts: Date.now() };
      setCookie(res, token);
      return res.status(200).json({ username: String(username).trim(), role: user.role });
    }

    // SESSION CHECK
    if (action === 'session' || (req.method === 'GET' && !action)) {
      const token  = leerCookie(req);
      const sesion = token && SESSIONS[token];
      if (!sesion) return res.status(200).json({ authenticated: false });
      return res.status(200).json({ authenticated: true, username: sesion.username, role: sesion.role });
    }

    // LOGOUT
    if (action === 'logout') {
      const token = leerCookie(req);
      if (token) delete SESSIONS[token];
      clearCookie(res);
      return res.status(200).json({ ok: true });
    }

    // ── Acciones de admin ─────────────────────────────────────────────────────
    const token  = leerCookie(req);
    const sesion = token && SESSIONS[token];
    if (!sesion || sesion.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede realizar esta acción' });
    }

    // LISTAR USUARIOS
    if (action === 'list_users') {
      const users = cargarUsuarios();
      const lista = Object.entries(users)
        .map(([u, d]) => ({ username: u, role: d.role }))
        .sort((a, b) => a.username.localeCompare(b.username));
      return res.status(200).json({ usuarios: lista });
    }

    // CREAR USUARIO
    if (action === 'create_user') {
      const { username, password, role } = body || {};
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'username, password y role son requeridos' });
      }
      if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
        return res.status(400).json({ error: 'Usuario inválido (3-32 chars, solo letras/números/._-)' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
      }
      if (!['lector','editor','admin'].includes(role)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      const users = cargarUsuarios();
      if (users[username]) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      users[username] = { hash: sha256(String(password)), role };
      await guardarUsuariosGitHub(users);
      return res.status(201).json({ ok: true, message: 'Usuario creado. Vercel redesplegará en ~30 segundos.' });
    }

    // CAMBIAR CONTRASEÑA
    if (action === 'change_password') {
      const { username, password } = body || {};
      if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' });
      if (String(password).length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
      const users = cargarUsuarios();
      if (!users[username]) return res.status(404).json({ error: 'Usuario no existe' });
      users[username].hash = sha256(String(password));
      await guardarUsuariosGitHub(users);
      return res.status(200).json({ ok: true, message: 'Contraseña actualizada. Vercel redesplegará en ~30 segundos.' });
    }

    // CAMBIAR ROL
    if (action === 'change_role') {
      const { username, role } = body || {};
      if (!username || !role) return res.status(400).json({ error: 'username y role requeridos' });
      if (username === 'admin' && role !== 'admin') return res.status(400).json({ error: 'No puedes degradar la cuenta admin' });
      if (!['lector','editor','admin'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
      const users = cargarUsuarios();
      if (!users[username]) return res.status(404).json({ error: 'Usuario no existe' });
      users[username].role = role;
      await guardarUsuariosGitHub(users);
      return res.status(200).json({ ok: true, message: 'Rol actualizado. Vercel redesplegará en ~30 segundos.' });
    }

    // ELIMINAR USUARIO
    if (action === 'delete_user') {
      const { username } = body || {};
      if (!username) return res.status(400).json({ error: 'username requerido' });
      if (username === 'admin') return res.status(400).json({ error: 'No puedes eliminar la cuenta admin' });
      const users = cargarUsuarios();
      if (!users[username]) return res.status(404).json({ error: 'Usuario no existe' });
      delete users[username];
      await guardarUsuariosGitHub(users);
      return res.status(200).json({ ok: true, message: 'Usuario eliminado. Vercel redesplegará en ~30 segundos.' });
    }

    // CARGAR DATOS COMPARTIDOS (todos los usuarios autenticados)
    if (action === 'load_data') {
      try {
        const repo  = process.env.GITHUB_REPO || 'juancomidaslapunta-dev/fill-rate-dashboard';
        const token = process.env.GITHUB_TOKEN;
        const getResp = await fetch(`https://api.github.com/repos/${repo}/contents/data.json`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json'
          }
        });
        if (!getResp.ok) {
          return res.status(200).json({ data: null, message: 'Sin datos compartidos aún' });
        }
        const fileData = await getResp.json();
        const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
        const data = JSON.parse(decoded);
        return res.status(200).json({ data, timestamp: fileData.updated_at });
      } catch(e) {
        return res.status(200).json({ data: null, error: e.message });
      }
    }

    // GUARDAR DATOS COMPARTIDOS (solo admin)
    if (action === 'save_data') {
      if (!['admin','explorer','editor'].includes(sesion.role)) {
        return res.status(403).json({ error: 'Solo Admin o Explorer puede guardar datos' });
      }
      const { data } = body || {};
      if (!data || !data.granular) return res.status(400).json({ error: 'data.granular requerido' });
      try {
        const sbUrl  = process.env.SUPABASE_URL;
        const sbKey  = process.env.SUPABASE_SERVICE_KEY;
        const hdrs   = { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Accept: 'application/json' };

        // 1. Borrar granular anterior
        const del = await fetch(`${sbUrl}/rest/v1/granular?id=gte.0`, { method: 'DELETE', headers: hdrs });
        if (!del.ok) throw new Error('DELETE granular: ' + await del.text());

        // 2. Insertar en chunks de 500
        const rows = data.granular.map(r => ({
          sku: r.sku||'', descripcion: r.descripcion||'', fecha: r.fecha||'',
          sucursal: r.sucursal||'', solicitado: Number(r.solicitado)||0,
          despachado: Number(r.despachado)||0, diferencia: Number(r.diferencia)||0,
          processed_at: data.processed_at || new Date().toISOString(),
          processed_by: data.processed_by || sesion.username
        }));
        const CHUNK = 500;
        for (let i = 0; i < rows.length; i += CHUNK) {
          const ins = await fetch(`${sbUrl}/rest/v1/granular`, {
            method: 'POST', headers: { ...hdrs, Prefer: 'return=minimal' },
            body: JSON.stringify(rows.slice(i, i + CHUNK))
          });
          if (!ins.ok) throw new Error('INSERT chunk ' + i + ': ' + await ins.text());
        }

        // 3. Guardar metadata en shared_meta
        await fetch(`${sbUrl}/rest/v1/shared_meta?id=gte.0`, { method: 'DELETE', headers: hdrs });
        await fetch(`${sbUrl}/rest/v1/shared_meta`, {
          method: 'POST', headers: { ...hdrs, Prefer: 'return=minimal' },
          body: JSON.stringify([{
            data_quality:  JSON.stringify(data.data_quality || {}),
            despachos_linea: '[]',
            processed_at:  data.processed_at || new Date().toISOString(),
            processed_by:  data.processed_by || sesion.username
          }])
        });

        return res.status(200).json({ ok: true, message: rows.length + ' filas guardadas en Supabase' });
      } catch(e) {
        return res.status(500).json({ error: 'Error guardando datos', detalle: e.message });
      }
    }

    // ── load_data — Supabase ──────────────────────────────────────────────────
    if (action === 'load_data') {
      try {
        const sbUrl  = process.env.SUPABASE_URL;
        const sbKey  = process.env.SUPABASE_SERVICE_KEY;
        const hdrs   = { apikey: sbKey, Authorization: `Bearer ${sbKey}`, Accept: 'application/json' };

        let granUrl = `${sbUrl}/rest/v1/granular?select=*&order=fecha.asc&limit=100000`;
        if (sesion.role === 'viewer_sucursal' && sesion.sucursal) {
          granUrl = `${sbUrl}/rest/v1/granular?select=*&sucursal=eq.${encodeURIComponent(sesion.sucursal)}&order=fecha.asc&limit=100000`;
        }

        const [granResp, metaResp] = await Promise.all([
          fetch(granUrl, { headers: hdrs }),
          fetch(`${sbUrl}/rest/v1/shared_meta?select=*&order=id.desc&limit=1`, { headers: hdrs })
        ]);
        if (!granResp.ok) throw new Error('Supabase granular: ' + await granResp.text());

        const rows = await granResp.json();
        if (!rows || rows.length === 0) {
          return res.status(200).json({ data: null, message: 'Sin datos en Supabase aún' });
        }

        let data_quality = {};
        if (metaResp.ok) {
          const meta = await metaResp.json();
          if (meta && meta[0]) {
            try { data_quality = JSON.parse(meta[0].data_quality || '{}'); } catch(e) {}
          }
        }

        return res.status(200).json({ data: { granular: rows, data_quality }, timestamp: new Date().toISOString() });
      } catch(e) {
        return res.status(500).json({ error: 'Error cargando datos', detalle: e.message });
      }
    }

    return res.status(400).json({ error: 'Acción no reconocida: ' + action });

  } catch(err) {
    console.error('[api/auth] error:', err);
    return res.status(500).json({ error: 'Error interno', detalle: String(err.message || err) });
  }
};
