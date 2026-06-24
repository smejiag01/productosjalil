# CLAUDE.md — Sistema de Pedidos WhatsApp · Productos Jalil

> Contexto del proyecto para Claude Code. Leer completo antes de empezar a trabajar.

---

## Resumen del proyecto

Sistema de automatización de pedidos vía WhatsApp para una **carnicería** llamada **Productos Jalil**, ubicada en Colombia. Cliente: PRODUCTOS JALIL TRADICION ARTESANAL.

- **País:** Colombia
- **Moneda:** Pesos colombianos (COP) — siempre formatear precios con símbolo `$` y separador de miles con punto (ej: $1.250.000)
- **Idioma del sistema:** Español (UI, variables, comentarios, mensajes de error, todo)

El cliente maneja ~150 clientes organizados por rutas de entrega. Cada día se les envía un mensaje recordatorio por WhatsApp para que hagan su pedido; el cliente arma el pedido seleccionando opciones (no texto libre), y el pedido queda registrado en el dashboard. El sistema exporta facturas diarias en Excel/CSV para importarlas al software contable Mekano.

**Desarrollado por:** SMEJIA (Gustavo Upegui Gómez y Sebastián Mejía Garcés)

## Diseños de referencia

En la carpeta `/disenos` de la raíz del proyecto hay imágenes de las pantallas diseñadas en Claude Design:
- `pedidos.png` — pantalla principal de pedidos del día
- `detalle-pedido.png` — detalle de un pedido
- `clientes.png` — módulo de clientes con precios personalizados
- `login.png` — pantalla de login

Respetar el estilo visual, paleta de colores y estructura de esas pantallas al implementar. Las pantallas no diseñadas explícitamente (inventario, rutas, empleados) deben seguir el mismo patrón visual.

---

## Stack técnico

- **Framework:** Next.js 14 (App Router) + TypeScript
- **ORM:** Prisma
- **Base de datos:** Neon PostgreSQL (serverless)
- **Autenticación:** NextAuth / Auth.js (con credenciales contra tabla `usuarios`)
- **Almacenamiento de imágenes:** Vercel Blob (optimizar a WebP al subir, con sharp)
- **Deploy:** Vercel
- **Automatización WhatsApp:** n8n self-hosted (Contabo VPS) — proyecto SEPARADO, no parte de este repo
- **WhatsApp:** Meta WhatsApp Cloud API (oficial)

---

## Arquitectura general

```
Dashboard (este repo, Next.js en Vercel)
    └── conectado a Neon PostgreSQL

n8n (Contabo VPS, separado)
    ├── conectado a la misma Neon PostgreSQL
    ├── recibe webhooks de WhatsApp (Meta Cloud API)
    └── consume la API de este dashboard cuando lo necesita

Meta WhatsApp Cloud API
    └── envía/recibe mensajes, dispara webhooks a n8n
```

La base de datos Neon es el punto de integración entre el dashboard y n8n. Ambos leen y escriben en ella.

> Nota: el n8n tiene su PROPIO PostgreSQL en el VPS solo para sus flujos internos. La base de datos del NEGOCIO (clientes, productos, pedidos) es la de Neon. No confundir.

---

## Modelo de datos (ya creado en Neon)

Las tablas ya existen en Neon (ver `modelo_db.sql`). Usar `prisma db pull` para introspeccionar y generar el schema, NO crear las tablas desde cero.

Tablas:
- **usuarios** — login del dashboard (password con bcrypt, rol, activo)
- **empleados** — personal del negocio
- **rutas** — rutas de entrega (día de semana, repartidor asignado)
- **clientes** — nombre, teléfono WhatsApp (único), dirección, ruta asignada, `codigo_mekano` (identificador del cliente para exportar a Mekano)
- **productos** — catálogo (nombre, imagen_url, unidad, precio_base, orden)
- **precios_cliente** — precio propio por cliente y producto (UNIQUE cliente+producto)
- **pedidos** — cabecera (cliente, ruta, estado, total, fecha_pedido)
- **pedido_items** — detalle (guarda nombre y precio al momento del pedido)
- **inventario** — stock por producto (stock_actual, stock_minimo)
- **conversaciones_wpp** — estado del flujo de WhatsApp por cliente (estado_flujo, carrito JSONB)

Estados de pedido: `pendiente`, `en_proceso`, `confirmado`, `cancelado`, `entregado`

---

## Módulos del dashboard a construir

1. **Autenticación** — login con NextAuth contra tabla `usuarios`. Un solo usuario admin por ahora.
2. **Módulo de pedidos** — vista principal. Pedidos del día por estado, detalle de cada pedido (productos, cantidades, precios), exportación a Excel del consolidado.
3. **Módulo de inventario** — control de productos y existencias, alertas de stock mínimo.
4. **Módulo de clientes** — CRUD de clientes, asignación de precios individuales por producto.
5. **Módulo de rutas** — crear/editar rutas, asignar clientes y día.
6. **Módulo de empleados** — CRUD del personal.
7. **Exportación Mekano** — botón para exportar facturas diarias en Excel/CSV compatible con Mekano. (El formato exacto de columnas está pendiente de confirmar con el cliente.)

---

## Decisiones de diseño tomadas

- **Precios:** cada cliente tiene su precio propio por producto (tabla `precios_cliente`). Si no existe precio para un cliente+producto, usar `precio_base` del producto como fallback.
- **Imágenes:** se suben a Vercel Blob, se optimizan a WebP con sharp, se guarda solo la URL.
- **Flujo de WhatsApp:** todo por SELECCIÓN de opciones (botones/listas interactivas), nunca texto libre ni audios. Esto reduce errores y mantiene el alcance controlado.
- **pedido_items** guarda nombre y precio históricos para que los pedidos viejos no cambien si se editan los productos.
- **Imágenes de producto** se muestran en el catálogo de WhatsApp durante la selección.
- **codigo_mekano** en la tabla `clientes` es el identificador que usa el software contable Mekano. Se incluye en la exportación de facturas para que Mekano asocie cada factura al cliente correcto. El formato exacto (numérico/alfanumérico, longitud) está pendiente de confirmar con el cliente.

---

## Convenciones de código

- TypeScript estricto.
- App Router (carpeta `app/`), Server Components por defecto, Client Components solo cuando se necesite interactividad.
- Route Handlers en `app/api/` para los endpoints que consume n8n.
- Validar inputs con Zod en los endpoints.
- Respuestas de API consistentes: `{ success, data, error }`.
- Variables sensibles en `.env` (nunca commitear): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BLOB_READ_WRITE_TOKEN`.
- Nombres de variables y comentarios en español (es el idioma del equipo y del cliente).

---

## Endpoints que n8n necesitará (diseñar pensando en esto)

- `GET /api/clientes/por-ruta?fecha=YYYY-MM-DD` → clientes con ruta ese día
- `GET /api/productos` → catálogo activo con precios (puede recibir cliente_id para precios personalizados)
- `POST /api/pedidos` → crear un pedido desde el flujo de WhatsApp
- `GET /api/pedidos/estado?cliente_id=&fecha=` → saber si un cliente ya hizo pedido
- `PATCH /api/pedidos/:id` → actualizar estado del pedido

Estos endpoints deben poder autenticarse con un API key o token de servicio (no con la sesión de NextAuth, que es para el dashboard humano).

---

## Pendientes / por confirmar con el cliente

- Formato exacto de columnas que pide Mekano para importar facturas
- Catálogo real de productos con sus variantes y precios
- Listado real de clientes con teléfonos y rutas
- Horario exacto para enviar los mensajes recordatorios
- Tiempo de espera antes del segundo mensaje (seguimiento)

---

## Primeros pasos sugeridos para Claude Code

1. Inicializar proyecto Next.js 14 + TypeScript + Tailwind.
2. Instalar y configurar Prisma, hacer `prisma db pull` contra Neon.
3. Configurar NextAuth con provider de credenciales contra tabla `usuarios`.
4. Crear un script de seed para insertar el primer usuario admin (con hash bcrypt).
5. Montar el layout base del dashboard con navegación entre módulos.
6. Empezar por el módulo de pedidos (es el core).