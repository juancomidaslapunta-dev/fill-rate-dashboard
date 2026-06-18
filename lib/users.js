// lib/users.js
// Capa de acceso a datos de usuarios, respaldada por Vercel KV (Redis).
// Las contraseñas SIEMPRE se guardan como hash bcrypt, nunca en texto plano.

const { getRedis } = require('./redis');
const bcrypt = require('bcryptjs');

const USERS_KEY = 'fillrate:users'; // hash de Redis: { username: JSON.stringify({passwordHash, role}) }
const BCRYPT_ROUNDS = 10;

const ROLES_VALIDOS = ['lector', 'editor', 'admin'];

function validarNombreUsuario(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_.-]{3,32}$/.test(username);
}

function validarPassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 200;
}

function validarRol(role) {
  return ROLES_VALIDOS.includes(role);
}

async function obtenerTodosLosUsuarios() {
  const raw = await getRedis().hgetall(USERS_KEY);
  if (!raw) return {};
  const result = {};
  for (const [username, value] of Object.entries(raw)) {
    // @vercel/kv puede devolver el valor ya parseado como objeto o como string, según versión
    result[username] = typeof value === 'string' ? JSON.parse(value) : value;
  }
  return result;
}

async function obtenerUsuario(username) {
  const raw = await getRedis().hget(USERS_KEY, username);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function guardarUsuario(username, datos) {
  await getRedis().hset(USERS_KEY, { [username]: JSON.stringify(datos) });
}

async function eliminarUsuarioDB(username) {
  await getRedis().hdel(USERS_KEY, username);
}

async function asegurarSeed() {
  // Si la base está completamente vacía (primer arranque), crear las cuentas iniciales.
  const existentes = await obtenerTodosLosUsuarios();
  if (Object.keys(existentes).length === 0) {
    const defaults = {
      admin: { role: 'admin', password: '123456' },
      editor: { role: 'editor', password: '123456' },
      lector: { role: 'lector', password: '123456' }
    };
    for (const [username, info] of Object.entries(defaults)) {
      const passwordHash = await bcrypt.hash(info.password, BCRYPT_ROUNDS);
      await guardarUsuario(username, { passwordHash, role: info.role });
    }
    return true;
  }
  // Asegurar que 'admin' siempre exista, incluso si fue borrado por error en datos antiguos
  const admin = await obtenerUsuario('admin');
  if (!admin) {
    const passwordHash = await bcrypt.hash('123456', BCRYPT_ROUNDS);
    await guardarUsuario('admin', { passwordHash, role: 'admin' });
  }
  return false;
}

async function verificarCredenciales(username, password) {
  const usuario = await obtenerUsuario(username);
  if (!usuario) return null;
  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) return null;
  return { username, role: usuario.role };
}

async function crearUsuarioDB(username, password, role) {
  if (!validarNombreUsuario(username)) {
    throw new Error('Nombre de usuario inválido (3-32 caracteres: letras, números, . _ -)');
  }
  if (!validarPassword(password)) {
    throw new Error('La contraseña debe tener entre 6 y 200 caracteres');
  }
  if (!validarRol(role)) {
    throw new Error('Rol inválido');
  }
  const existente = await obtenerUsuario(username);
  if (existente) {
    throw new Error('El usuario ya existe');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await guardarUsuario(username, { passwordHash, role });
}

async function cambiarRolDB(username, nuevoRol) {
  if (!validarRol(nuevoRol)) {
    throw new Error('Rol inválido');
  }
  if (username === 'admin' && nuevoRol !== 'admin') {
    throw new Error('No se puede quitar el rol de administrador a la cuenta "admin"');
  }
  const usuario = await obtenerUsuario(username);
  if (!usuario) {
    throw new Error('El usuario no existe');
  }
  usuario.role = nuevoRol;
  await guardarUsuario(username, usuario);
}

async function cambiarPasswordDB(username, nuevaPassword) {
  if (!validarPassword(nuevaPassword)) {
    throw new Error('La contraseña debe tener entre 6 y 200 caracteres');
  }
  const usuario = await obtenerUsuario(username);
  if (!usuario) {
    throw new Error('El usuario no existe');
  }
  usuario.passwordHash = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);
  await guardarUsuario(username, usuario);
}

async function eliminarUsuarioPublico(username) {
  if (username === 'admin') {
    throw new Error('No se puede eliminar la cuenta administrador');
  }
  const usuario = await obtenerUsuario(username);
  if (!usuario) {
    throw new Error('El usuario no existe');
  }
  await eliminarUsuarioDB(username);
}

async function listarUsuariosPublico() {
  const todos = await obtenerTodosLosUsuarios();
  // Nunca exponer el hash de la contraseña al cliente
  const lista = Object.entries(todos).map(([username, info]) => ({
    username,
    role: info.role
  }));
  lista.sort((a, b) => a.username.localeCompare(b.username));
  return lista;
}

module.exports = {
  asegurarSeed,
  verificarCredenciales,
  crearUsuarioDB,
  cambiarRolDB,
  cambiarPasswordDB,
  eliminarUsuarioPublico,
  listarUsuariosPublico,
  validarNombreUsuario,
  validarPassword,
  validarRol,
  ROLES_VALIDOS
};
