# 📊 Dashboard Fill Rate - Logística en Tiempo Real

**Análisis de cumplimiento de entregas (Fill Rate) por SKU, sucursal y semana.**

## 🚀 Demo en Vivo

🔗 **[Abre el Dashboard](https://fill-rate-dashboard.vercel.app)** (en producción)

## ¿Qué es?

App web para analizar la logística en tiempo real:
- 📈 **Fill Rate**: % de solicitudes que se despacharon
- 🏪 **Por Sucursal**: Identifica locales con problemas
- 📅 **Históricos**: Tendencias de 8+ semanas
- 📊 **Exportación**: Descarga reportes a Excel

## ✨ Características

✅ **Cero Back-end** - 100% en navegador  
✅ **Datos Privados** - No se envían a servidores  
✅ **Múltiples Filtros** - Análisis granular  
✅ **Exportación Excel** - Reportes automáticos  
✅ **Históricos** - 8 semanas incluidas  
✅ **Móvil** - Responsive en cualquier dispositivo  

## 🎯 Cómo Usar

### Opción 1: Demo (Ya cargado)
1. Abre el [Dashboard](https://fill-rate-dashboard.vercel.app)
2. Ve a pestaña **📈 Dashboard** → verás datos de ejemplo (Semana 24)
3. Filtra por sucursal, semana, día
4. Ve a **🔍 Análisis** → tabla detalle SKU+Sucursal

### Opción 2: Con Tus Datos
1. Abre el Dashboard
2. Pestaña **📂 Importar Archivos**
3. Carga 4 archivos Excel:
   - Solicitudes de Sucursales
   - Guías de Despacho
   - Inventarios
   - Programa de Ventas
4. Click **Procesar**
5. Analiza métricas en Dashboard

### Opción 3: Con Históricos
1. Descarga [historicos_completos.xlsx](./historicos_completos.xlsx) (8 semanas)
2. Cargalo en **📂 Importar** (como "Solicitudes")
3. Verás tendencias de 8 semanas

## 📊 KPIs Principales

```
Fill Rate General:     92.8%
Solicitado (sem 24):   47,890 unidades
Despachado:            44,461 unidades
Diferencia:            3,429 unidades

Por Sucursal (sem 24):
  🟢 MANQUEHUE:       98.0% (Excelente)
  🟡 RENATO SÁNCHEZ:  88.3% (Bajo)
  🔴 DEHESA:          78.7% (Crítico)
  🔴 CHICUREO:        80.2% (Crítico)
```

## 🔐 Seguridad

✅ **Sin login** (datos locales)  
✅ **Sin servidor** (procesa en navegador)  
✅ **Sin persistencia** (datos se borran al cerrar)  
✅ **HTTPS obligatorio** (Vercel + SSL gratis)  
✅ **Headers de seguridad** (CSP, X-Frame-Options, etc.)  
✅ **Código open-source** (auditable)  

## 🛠️ Desarrollo Local

```bash
# Clonar repo
git clone https://github.com/tuuser/fill-rate-dashboard.git
cd fill-rate-dashboard

# Abrir en navegador
open index.html

# O servir con Python
python3 -m http.server 8000
# Luego: http://localhost:8000
```

## 📈 Plan de Crecimiento

- ✅ **Semana 1**: Publicación + Seguridad
- ⏳ **Semana 2**: Analytics (Sentry + Google)
- ⏳ **Semana 3**: Históricos en BD (Supabase)
- ⏳ **Semana 4**: Alertas + Predicción ML

## 📞 Soporte

- 🐛 **Bugs**: Abre issue en GitHub
- 💬 **Feedback**: [feedback@fill-rate-app.com](mailto:feedback@fill-rate-app.com)
- 📚 **Docs**: Ver [SECURITY_AUDIT_REPORT.md](./docs/SECURITY_AUDIT_REPORT.md)

## 📄 Licencia

MIT - Úsalo libremente

---

**Última actualización**: Junio 17, 2026  
**Versión**: 1.1  
**Status**: ✅ En Producción

Hecho con ❤️ para logística moderna
