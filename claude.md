# CLAUDE.md — Sistema de Pedidos WhatsApp · Productos Jalil

> Contexto del proyecto para Claude Code. Leer completo antes de empezar a trabajar.

---

## Resumen del proyecto

Sistema de automatización de pedidos vía WhatsApp para una **carnicería** llamada **Productos Jalil**, ubicada en Colombia. Cliente: PRODUCTOS JALIL TRADICION ARTESANAL.

- **País:** Colombia
- **Moneda:** Pesos colombianos (COP) — siempre formatear precios con símbolo `$` y separador de miles con punto (ej: $1.250.000)
- **Idioma del sistema:** Español (UI, variables, comentarios, mensajes de error, todo)

El cliente maneja ~150 clientes organizados por rutas de entrega. Cada día se les envía un mensaje recordatorio por WhatsApp para que hagan su pedido; el cliente arma el pedido seleccionando opciones (no texto libre), y el pedido queda registrado en el dashboard. El sistema exporta los pedidos del día en Excel (detalle, matriz por ruta, resumen por cliente) y un PDF de despacho.

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

- **Framework:** Next.js 15 (App Router) + TypeScript
- **ORM:** Prisma
- **Base de datos:** Neon PostgreSQL (serverless)
- **Autenticación:** NextAuth / Auth.js (con credenciales contra tabla `usuarios`)
- **Almacenamiento de imágenes:** Vercel Blob (optimizar a JPEG al subir, con sharp — WebP no es compatible con mensajes de imagen de WhatsApp Business API)
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
- **rutas** — rutas de entrega (`dias_semana` es un array de días SMALLINT[], `frecuencia` puede ser 'semanal' o 'quincenal', repartidor asignado). Algunas rutas salen más de un día a la semana (ej: Pereira sale martes y viernes)
- **clientes** — nombre, teléfono WhatsApp (único), dirección, ruta asignada, `codigo_mekano` (identificador del cliente para exportar a Mekano)
- **productos** — catálogo (nombre, imagen_url, unidad, precio_base, orden)
- **precios_cliente** — precio propio por cliente y producto (UNIQUE cliente+producto)
- **pedidos** — cabecera (cliente, ruta, estado, total, fecha_pedido)
- **pedido_items** — detalle (guarda nombre y precio al momento del pedido)
- **inventario** — stock por producto (stock_actual, stock_minimo)
- **conversaciones_wpp** — estado del flujo de WhatsApp por cliente (estado_flujo, carrito JSONB)
- **configuracion** — parámetros generales del negocio (un solo registro siempre). Incluye: datos del negocio (nombre, NIT, dirección, teléfono), configuración de mensajes WhatsApp (hora_recordatorio, horas_espera_followup, mensaje_recordatorio, mensaje_followup)

Estados de pedido: `pendiente`, `en_proceso`, `confirmado`, `en_reparto`, `entregado`, `devuelto`, `cancelado` (ver `lib/pedidos.ts`)

---

## Módulos del dashboard a construir

1. **Autenticación** — login con NextAuth contra tabla `usuarios`. Un solo usuario admin por ahora.
2. **Módulo de pedidos** — vista principal. Pedidos del día por estado, detalle de cada pedido (productos, cantidades, precios), exportación a Excel del consolidado.
3. **Módulo de inventario** — control de productos y existencias, alertas de stock mínimo.
4. **Módulo de clientes** — CRUD de clientes, asignación de precios individuales por producto.
5. **Módulo de rutas** — crear/editar rutas, asignar clientes y día.
6. **Módulo de empleados** — CRUD del personal.
7. **Exportaciones** — Excel de pedidos, matriz por ruta, resumen por cliente, informes por rango y PDF de despacho. (La integración específica con Mekano quedó fuera de alcance.)
8. **Módulo de configuración** — parámetros generales del negocio editables por el cliente: datos del negocio, textos y horarios de mensajes WhatsApp, cambio de contraseña del admin. Las credenciales sensibles (tokens Meta, API keys) van SOLO en variables de entorno, nunca en este módulo.

---

## Decisiones de diseño tomadas

- **Precios:** cada cliente tiene su precio propio por producto (tabla `precios_cliente`). Si no existe precio para un cliente+producto, usar `precio_base` del producto como fallback.
- **Imágenes:** se suben a Vercel Blob, se optimizan a JPEG (calidad 85) con sharp, se guarda solo la URL. JPEG en vez de WebP porque la API de WhatsApp Business para mensajes tipo "image" no soporta WebP (reservado para stickers).
- **Flujo de WhatsApp:** todo por SELECCIÓN de opciones (botones/listas interactivas), nunca texto libre ni audios. Esto reduce errores y mantiene el alcance controlado.
- **pedido_items** guarda nombre y precio históricos para que los pedidos viejos no cambien si se editan los productos.
- **Imágenes de producto** se muestran en el catálogo de WhatsApp durante la selección.
- **codigo_mekano** en la tabla `clientes` es el identificador que usa el software contable Mekano. Se incluye en la exportación de facturas para que Mekano asocie cada factura al cliente correcto.

---

## Convenciones de código

- TypeScript estricto.
- App Router (carpeta `app/`), Server Components por defecto, Client Components solo cuando se necesite interactividad.
- Route Handlers en `app/api/` para los endpoints que consume n8n.
- Validar inputs con Zod en los endpoints.
- Respuestas de API consistentes: `{ success, data, error }`.
- Variables sensibles en `.env` (nunca commitear): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `API_SECRET_KEY`, `N8N_UPLOAD_SECRET`, `TIENDA_SESSION_SECRET`, `N8N_PEDIDO_WEBHOOK_URL`, `N8N_PEDIDO_WEBHOOK_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (opcional, pública).
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

## Tienda en línea para clientes (`/tienda`)

Los clientes hacen su pedido en la web (reemplaza el flujo de pedidos por WhatsApp). Vive en este mismo repo.

- **Sesión independiente del admin**: cookie `tienda_session` (httpOnly, secure, sameSite=lax) firmada con `TIENDA_SESSION_SECRET` usando `encode/decode` de `next-auth/jwt`. `middleware.ts` resuelve la rama `/tienda` con return temprano, ANTES de la lógica admin (que se preserva igual).
- **Login**: solo el NIT (normalizado: sin puntos, espacios ni dígito de verificación); debe haber un único cliente activo con ese NIT. Decisión del negocio: no hay segundo factor, así que quien conozca un NIT puede entrar a esa cuenta. Se mitiga con mensaje de error genérico y límite de intentos en BD (`tienda_login_intentos`: 5 fallos por NIT / 20 por IP en 15 min).
- **Botón "Soy cliente nuevo"** en el login: abre WhatsApp al número de `configuracion.whatsapp_atencion` (editable en Configuración → Negocio; vacío = se oculta).
- **Catálogo y carrito**: precios por cliente (`lib/precios.ts`); el carrito persiste en la cookie httpOnly `tienda_carrito` (solo producto_id + cantidad, sin precios).
- **Pedido** (`POST /api/tienda/pedidos`): transaccional; el servidor recalcula TODO (precios, subtotales, total) y valida que `fecha_entrega` esté entre las fechas reales de la ruta del cliente (`lib/fechas-entrega.ts`), que `sede_id` sea del cliente y esté activa, que el cliente tenga ruta y que los productos sigan activos. Máximo 10 pedidos por hora por cliente.
- **Aviso a n8n**: tras crear el pedido se hace un POST best-effort (nunca afecta al pedido) a `N8N_PEDIDO_WEBHOOK_URL` con `{ pedido_id, telefono }` y el header `x-internal-secret` (`N8N_PEDIDO_WEBHOOK_SECRET`) para que n8n envíe el WhatsApp de confirmación.

## Ubicación en Google Maps (clientes y sedes)

- `components/UbicacionMapa.tsx` reemplaza los campos manuales de latitud/longitud: dirección + buscador de lugares + mapa con pin arrastrable. Lo usan `ModalCliente` y `ModalSede`; `clientes` y `sedes` guardan `latitud`/`longitud` (la pantalla solo muestra "Ver en Google Maps").
- Variable pública `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (en `.env` y en Vercel): clave de Google Cloud con **Maps JavaScript API** y **Places API (New)** habilitadas, restringida por dominio (HTTP referrer). Es opcional: sin ella el formulario funciona en modo alterno (se pega un enlace de Google Maps o `lat, lng` y se ve una vista previa).
- `POST /api/ubicacion/resolver` (solo admin) convierte enlaces de Google Maps, incluidos los cortos `maps.app.goo.gl`, en coordenadas; solo sigue redirecciones hacia dominios de Google (`lib/ubicacion.ts`, con tests).
- El repartidor navega con las coordenadas de la sede; si no hay sede o es la principal, usa las del cliente.

## App del vendedor (`/vendedor`)

- Rol `vendedor` (se crea en Usuarios). `lib/rutas-acceso.ts` (`redireccionPorRol`) deja a repartidor y vendedor solo en su app y saca al admin de ellas.
- Reemplaza el "Informe diario de visitas" en papel: **Iniciar día de visitas** (ciudad, hora y ubicación de ingreso) → **Registrar visita** (nicho, negocio, dirección, teléfono, contacto, observaciones; hora y ubicación automáticas) → **Finalizar día**.
- Funciona sin señal: el estado y una cola de operaciones viven en `localStorage` (`lib/vendedor-local.ts`) y se envían en orden a `POST /api/vendedor/sincronizar`, idempotente porque los ids los genera el celular. Tablas `jornadas_visita` y `visitas` (`prisma/sql/20261109_visitas_vendedores.sql`). Validación en `lib/visitas.ts` (con tests).
- `Permissions-Policy` permite `geolocation=(self)` para la ubicación.

## Pruebas, base de datos y dependencias

- `npm test` (Jest, funciones puras en `lib/__tests__/`) y `npm run build` (corre ESLint y tipos como Vercel) antes de subir.
- `npm run check:ui` (scripts/check-ui.ts) vigila el sistema de diseño: falla ante `gray-*`, colores crudos de Tailwind, `confirm()`/`alert()` nativos, `<svg` sueltos (los íconos salen de `components/ui/icons.ts`) y radios crudos (usar `rounded-control`/`rounded-card`). Los colores y tokens viven en `lib/design/tokens.ts`; los componentes compartidos en `components/ui/`.
- **Cambios de BD**: el proyecto NO usa Prisma Migrate (usa introspección). Se escribe SQL idempotente en `prisma/sql/`, se aplica con `npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/<archivo>.sql`, se refleja en `schema.prisma` y se corre `npx prisma generate`. Solo cambios aditivos sin confirmar antes.
- **Seguridad de dependencias**: `npm audit --omit=dev` debe dar 0. `xlsx` se instala desde el CDN oficial de SheetJS (la versión de npm está sin parche) y hay `overrides` en `package.json` para `postcss` (dentro de Next) y `zod` (dentro de `@vercel/cli-config`). El resto de avisos de `npm audit` son de herramientas de desarrollo (ESLint/Jest) por `minimatch`, sin versión corregida disponible en esas herramientas.
- Los secretos de producción nunca se pegan en el chat ni se commitean: se generan a un archivo local ignorado por git y se copian a Vercel.

---

## Pendientes / por confirmar con el cliente

- Catálogo real de productos con sus variantes y precios
- Listado real de clientes con teléfonos y rutas
- Horario exacto para enviar los mensajes recordatorios
- Tiempo de espera antes del segundo mensaje (seguimiento)

---

## Primeros pasos sugeridos para Claude Code

1. Inicializar proyecto Next.js 15 + TypeScript + Tailwind.
2. Instalar y configurar Prisma, hacer `prisma db pull` contra Neon.
3. Configurar NextAuth con provider de credenciales contra tabla `usuarios`.
4. Crear un script de seed para insertar el primer usuario admin (con hash bcrypt).
5. Montar el layout base del dashboard con navegación entre módulos.
6. Empezar por el módulo de pedidos (es el core).