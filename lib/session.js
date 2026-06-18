// lib/session.js
// Gestión de sesiones server-side. El token se guarda en KV con expiración
// y se entrega al navegador como cookie httpOnly (no accesible desde JS,
// no se puede robar vía XSS, y es independiente de localStorage).

const crypto = require('crypto');
const { getRedis } = require('./redis');

const SESSION_PREFIX = 'fillrate:session:';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const COOKIE_NAME = 'fr_session';

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function crearSesion(username, role) {
  const token = generarToken();
  await getRedis().set(SESSION_PREFIX + token, JSON.stringify({ username, role }), {
    ex: SESSION_TTL_SECONDS
  });
  return token;
}

async function obtenerSesion(token) {
  if (!token) return null;
  const raw = await getRedis().get(SESSION_PREFIX + token);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function destruirSesion(token) {
  if (!token) return;
  await getRedis().del(SESSION_PREFIX + token);
}

function leerCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const partes = header.split(';').map(p => p.trim());
  for (const parte of partes) {
    const idx = parte.indexOf('=');
    if (idx === -1) continue;
    const key = parte.slice(0, idx);
    const value = parte.slice(idx + 1);
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

function construirCookieSet(token, maxAgeSeconds) {
  // Secure + HttpOnly + SameSite=Lax: el navegador la maneja sola, JS no puede leerla.
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function construirCookieClear() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function obtenerSesionDesdeRequest(req) {
  const token = leerCookie(req, COOKIE_NAME);
  if (!token) return null;
  const sesion = await obtenerSesion(token);
  if (!sesion) return null;
  return { token, ...sesion };
}

module.exports = {
  COOKIE_NAME,
  crearSesion,
  obtenerSesion,
  destruirSesion,
  leerCookie,
  construirCookieSet,
  construirCookieClear,
  obtenerSesionDesdeRequest
};
