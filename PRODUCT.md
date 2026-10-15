# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jefatura logística / abastecimiento:** revisan el cumplimiento entre lo que los locales solicitan y lo que la fábrica despacha, y cuáles locales y productos quiebran.
- **Producción / fábrica:** trabajan con las hojas de solicitud por local y SKU (empanadas, lasañas, quiches, roast beef, etc.) para producir y despachar.
- **Gerencia / dirección:** lectura de los indicadores de cumplimiento.
- Existen roles de acceso (admin, explorer, editor, viewer global, viewer por sucursal y lector). Los encargados de local como audiencia no fueron confirmados como usuarios diarios.

## Product Purpose

Dashboard logístico de Comidas La Punta que cruza solicitudes de los locales con despachos de la fábrica (sucursales 299 a 900). Su uso principal confirmado es **preparar la producción del día**: consolidar solicitudes por local y SKU, con conversiones de packs a granel, y entregarlas en hojas imprimibles. Además mide el cumplimiento: Solicitado, Despachado, De menos, De más, Fill Rate por volumen, Exacto y Ajustado.

## Positioning

El cumplimiento se calcula a nivel SKU, día y sucursal, y el Fill Rate Ajustado considera sustituciones válidas entre producto congelado y fresco, calculadas por semana completa y sucursal con un catálogo de equivalencias del negocio. No es un reporte genérico de ventas.

## Operating Context

- Los datos entran por archivos exportados de los sistemas de la empresa y cargados a mano en la pestaña Importar Archivos: Solicitudes (CSV o Excel con estados EMITIDO, DESPACHADO PARCIAL, DESPACHADO y RECHAZADO), Guías de despacho, Inventarios, Programa y Venta semana.
- Se excluyen los pedidos rechazados y las plantillas de materias primas.
- Se trabaja por semana ISO, con filtros por local, semana y día.
- Las hojas de solicitud se imprimen en formato horizontal y deben caber en una página.
- Pestañas actuales: Dashboard, Análisis, Stock, Detalle, Empanadas, Otros, Guías de Despacho e Importar Archivos.

## Capabilities and Constraints

- Un solo archivo `index.html` con HTML y JavaScript vanilla, desplegado en Vercel (push a `main`), con una función serverless `/api/auth` para el acceso.
- Locales oficiales: 299 Manquehue, 300 Vitacura, 302 Quinchamalí, 303 Dehesa, 314 Bulnes Correa, 316 Renato Sánchez, 426 Chicureo, 483 Padre Hurtado, 500 Maitencillo, 526 Las Lilas y 900 Fábrica.
- Reglas de negocio confirmadas: Chicureo y Las Lilas piden en packs y el total a granel se muestra multiplicando por 10 (el pack 1110063 equivale a 5 + 5 de queso horno y pino carne, en todos los locales); algunos frescos no tienen congelado equivalente (2101003, 2101012, 2101024).
- **Abierto:** el proyecto de Supabase (`kpi_fill_rate`) no responde (el dominio no resuelve), así que guardar y cargar datos compartidos no funciona hoy. Falta decidir si se recrea o se reemplaza.
- **Abierto:** hay una carga manual en cada sesión mientras no exista almacenamiento compartido.

## Evidence on Hand

- Archivos reales de solicitudes semanales con columnas ID, EMISION, CODIGO, TIENDA SOLICITANTE, FECHA REQUERIDA, ENTREGA, PLANTILLA, ESTADO, SKU, PRODUCTO, CANTIDAD, SOLICITUD, DESPACHO y RECEPCION.
- Catálogo de equivalencias congelado ↔ fresco entregado por el negocio: 15 pares de empanadas y 20 de lasañas.
- No hay archivo de despachos de la semana en curso en el entorno de trabajo; no inventar valores de despacho.

## Product Principles

1. **La hoja de producción manda:** lo que se imprime debe ser legible, alineado a la izquierda y caber en una página horizontal.
2. **Las cifras se explican:** cada indicador deja claro su base (período o semana completa) y su regla de cálculo.
3. **Nunca inventar datos:** sin archivo de despachos o sin solicitudes, se muestra la ausencia y no un número supuesto.
4. **Reglas del negocio explícitas:** conversiones, exclusiones y equivalencias viven en listas legibles del código y se confirman con el negocio antes de cambiarlas.
5. **Cambios probados con datos reales antes de publicar:** se muestra un preview y se publica solo con confirmación.
