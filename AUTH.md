# 🔐 SISTEMA DE AUTENTICACIÓN

## CREDENCIALES

```
Rol: LECTOR (Lectura)
  Usuario:    lector
  Contraseña: *APTRJdUf$hOcE6u
  Permisos:   • Ver Dashboard
              • Ver Análisis
              • Ver Guías de Despacho
              • Exportar Excel

Rol: EDITOR (Lectura + Escritura)
  Usuario:    editor
  Contraseña: LKrxJ^AU&mY!FHTW
  Permisos:   • Todo lo anterior +
              • Importar archivos Excel
              • Procesar datos
              • Actualizar históricos
```

---

## ARQUITECTURA DE SEGURIDAD

### Fase 1: Client-Side (ACTUAL)
```
✅ Login en navegador (sessionStorage)
✅ Control de permisos por rol
✅ Interfaz adaptada según rol
⚠️  Contraseñas en index.html (para desarrollo)
```

### Fase 2: Environment Variables (VERCEL)
```
En Vercel → Project Settings → Environment Variables:

LECTOR_PASS = *APTRJdUf$hOcE6u
EDITOR_PASS = LKrxJ^AU&mY!FHTW
```

### Fase 3: Backend Seguro (FUTURO)
```
⏳ Próxima semana:
   • Backend en Node.js/Python
   • Hash de contraseñas (bcrypt)
   • JWT tokens
   • Refresh tokens
   • Rate limiting
   • Audit logs
```

---

## FLUJO DE LOGIN

```
┌─────────────────┐
│  Usuario abre   │
│ aplicación      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ¿Sesión activa? │
└────┬─────────┬──┘
     │         │
     NO        SI
     │         │
     ▼         ▼
[LOGIN]  [DASHBOARD]
     │
     ▼
┌──────────────────┐
│ Usuario/Password │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ¿Credenciales    │
│ válidas?         │
└────┬──────────┬──┘
     │          │
     NO         SI
     │          │
     ▼          ▼
  [ERROR]  [Guardar en
            sessionStorage]
             │
             ▼
         [DASHBOARD]
```

---

## IMPLEMENTACIÓN ACTUAL

### Archivos

```
index_with_auth.html
  ├── Pantalla de login
  ├── Validación de credenciales
  ├── Almacenamiento en sessionStorage
  └── Redirige a dashboard.html

dashboard.html
  ├── Lee usuario de sessionStorage
  ├── Verifica rol y permisos
  ├── Oculta/muestra funciones según rol
  └── Botón "Cerrar sesión" (limpia sessionStorage)
```

### SessionStorage

```javascript
// Se almacena así:
{
  "usuario": "lector",
  "role": "viewer",
  "permissions": ["view"],
  "loginTime": "2026-06-17T15:30:00Z"
}

// Si usuario cierra la pestaña → sesión se borra
// Si recarga la página → sesión se mantiene
// Si abre en otra pestaña → no hay sesión
```

---

## PERMISOS POR ROL

### LECTOR (Viewer)
```
✅ Ver Dashboard
   • KPIs
   • Gráficos
   • Filtros

✅ Ver Análisis
   • Tabla detalle
   • Filtros en encabezados
   • Resumen

✅ Ver Guías
   • 171 guías
   • Modal detalle

✅ Exportar
   • Descargar Excel

❌ Importar
❌ Procesar datos
```

### EDITOR (Editor)
```
✅ Todo lo de LECTOR +

✅ Importar
   • Cargar archivos .xlsx
   • 4 tipos (Solicitudes, Despachos, Inventario, Programa)

✅ Procesar
   • Procesar datos automáticamente
   • Ver progreso

✅ Eliminar
   • Archivos cargados
```

---

## CONFIGURACIÓN EN VERCEL

### Variables de Entorno

Ir a: https://vercel.com → fill-rate-dashboard → Settings → Environment Variables

Agregar:
```
Name:  LECTOR_PASS
Value: *APTRJdUf$hOcE6u
Scope: Production, Preview, Development

Name:  EDITOR_PASS
Value: LKrxJ^AU&mY!FHTW
Scope: Production, Preview, Development
```

### Alternativa: .env Local

Para pruebas locales, crear `.env.local`:
```
LECTOR_PASS=*APTRJdUf$hOcE6u
EDITOR_PASS=LKrxJ^AU&mY!FHTW
```

**NO INCLUIR en Git** (ya en .gitignore)

---

## PRUEBAS

### Test 1: Login Lector
```
Usuario: lector
Password: *APTRJdUf$hOcE6u
Resultado: Acceso a Dashboard sin botón "Importar"
```

### Test 2: Login Editor
```
Usuario: editor
Password: LKrxJ^AU&mY!FHTW
Resultado: Acceso completo con botón "Importar"
```

### Test 3: Login Fallido
```
Usuario: admin
Password: wrongpassword
Resultado: Mensaje "Usuario o contraseña incorrectos"
```

### Test 4: Sesión
```
1. Loguea con "lector"
2. Recarga página → sesión se mantiene
3. Abre otra pestaña → NO hay sesión
4. Cierra pestaña → sesión se borra
```

---

## SEGURIDAD: CONSIDERACIONES

### ✅ ACTUAL (Fase 1)
```
✅ Contraseñas no se transmiten en la URL
✅ sessionStorage (no localStorage)
✅ Se borra al cerrar la pestaña
✅ No se guarda historial de contraseñas
✅ HTTPS obligatorio en Vercel
```

### ⚠️ LIMITACIONES
```
⚠️ Contraseñas visibles en HTML (desarrollo)
⚠️ Sin hashing de contraseñas
⚠️ Sin auditoría de accesos
⚠️ Sin renovación de tokens
```

### ✅ MEJORAS (Fase 3 - Backend)
```
→ Backend Node.js / Python
→ Contraseñas hasheadas (bcrypt)
→ JWT + Refresh tokens
→ Rate limiting
→ Auditoría de accesos
→ Gestión de usuarios
→ Cambio de contraseña
```

---

## CAMBIAR CONTRASEÑAS

### Local (desarrollo)
```bash
# Editar credenciales en código
nano index_with_auth.html
# Buscar: const CREDENTIALS = {
# Cambiar contraseñas
# Guardar y hacer push
```

### Vercel (producción)
```
1. https://vercel.com
2. fill-rate-dashboard → Settings
3. Environment Variables
4. Editar LECTOR_PASS y EDITOR_PASS
5. Guardar
6. Nuevo deploy automático
```

---

## FLUJO DE RESET DE CONTRASEÑA (Futuro)

```
⏳ Próxima semana:

1. Usuario olvida contraseña
2. Click "¿Olvidaste contraseña?"
3. Ingresa correo
4. Recibe email con link
5. Click link → formulario nuevo password
6. Password se actualiza en BD
```

---

## AUDITORÍA DE ACCESOS (Futuro)

```
⏳ Próxima semana:

Sistema de logs:
  ✓ Quién accedió
  ✓ Cuándo
  ✓ Desde dónde (IP)
  ✓ Qué hizo
  ✓ Si fue exitoso o no

Almacenado en Supabase:
  → Análisis de seguridad
  → Cumplimiento normativo
  → Alertas de acceso sospechoso
```

---

## PREGUNTAS FRECUENTES

### P: ¿Dónde guardo las contraseñas?
R: Las contraseñas están en:
   - index_with_auth.html (desarrollo)
   - Environment Variables de Vercel (producción)

### P: ¿Se ven las contraseñas si inspecciono el HTML?
R: SÍ (en Fase 1). Por eso es temporal. Fase 3 las mueve a backend.

### P: ¿Puedo cambiar las contraseñas?
R: SÍ. Edita en vercel.json o Environment Variables.

### P: ¿Qué pasa si pierdo la contraseña?
R: Regenera una nueva y actualiza en Vercel.

### P: ¿Cómo expiro sesiones?
R: Se expiran automáticamente al cerrar la pestaña.

### P: ¿Puedo agregar más usuarios?
R: SÍ. Edita const CREDENTIALS en index_with_auth.html.

---

## PRÓXIMOS PASOS

### Semana 1 (HOY)
```
✅ Contraseñas generadas
✅ Login HTML creado
✅ Permisos por rol implementados
→ Push a GitHub y deploy en Vercel
```

### Semana 2
```
→ Supabase para historiales
→ Backend básico
→ Auditoría de accesos
```

### Semana 3
```
→ JWT tokens
→ Refresh tokens
→ Rate limiting
→ Reset de password
```

### Semana 4
```
→ Multi-usuario
→ Gestión de usuarios
→ Alertas de seguridad
→ API REST autenticada
```

---

**Versión**: 1.0  
**Generado**: Junio 17, 2026  
**Estado**: ✅ Fase 1 Completa
