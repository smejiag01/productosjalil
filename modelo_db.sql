-- ============================================================
-- MODELO DE BASE DE DATOS — Sistema de pedidos WhatsApp
-- Cliente: PRODUCTOS JALIL TRADICION ARTESANAL
-- Proyecto: SMEJIA
-- Motor: PostgreSQL (Neon)
-- ============================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: usuarios (acceso al dashboard)
-- ============================================================
CREATE TABLE usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    correo        VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,        -- contraseña encriptada con bcrypt
    rol           VARCHAR(40)  NOT NULL DEFAULT 'admin',
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: empleados
-- ============================================================
CREATE TABLE empleados (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(120) NOT NULL,
    cargo       VARCHAR(80),
    telefono    VARCHAR(40),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: rutas
-- ============================================================
CREATE TABLE rutas (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    -- día de la semana en que sale la ruta (0=domingo ... 6=sábado)
    dia_semana   SMALLINT CHECK (dia_semana BETWEEN 0 AND 6),
    empleado_id  UUID REFERENCES empleados(id) ON DELETE SET NULL, -- repartidor asignado
    activa       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE clientes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_mekano VARCHAR(40) UNIQUE,             -- código del cliente para exportar/importar a Mekano
    nombre        VARCHAR(160) NOT NULL,
    telefono      VARCHAR(40)  NOT NULL UNIQUE,   -- número de WhatsApp (formato internacional)
    direccion     TEXT,
    ruta_id       UUID REFERENCES rutas(id) ON DELETE SET NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    notas         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE productos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(140) NOT NULL,
    descripcion   TEXT,
    imagen_url    TEXT,                            -- URL en Vercel Blob
    -- unidad de medida: kg, unidad, caja, etc.
    unidad        VARCHAR(30)  NOT NULL DEFAULT 'unidad',
    precio_base   NUMERIC(12,2) NOT NULL DEFAULT 0, -- precio de referencia
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    orden         INT          NOT NULL DEFAULT 0,  -- para ordenar en el menú de WhatsApp
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: precios_cliente (precio propio por cliente y producto)
-- ============================================================
CREATE TABLE precios_cliente (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id   UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    precio       NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- un cliente solo puede tener un precio por producto
    UNIQUE (cliente_id, producto_id)
);

-- ============================================================
-- TABLA: pedidos (cabecera)
-- ============================================================
CREATE TABLE pedidos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    ruta_id       UUID REFERENCES rutas(id) ON DELETE SET NULL,
    -- estado del pedido en el flujo
    estado        VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','en_proceso','confirmado','cancelado','entregado')),
    total         NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha_pedido  DATE NOT NULL DEFAULT CURRENT_DATE,  -- fecha para la que se hace el pedido
    confirmado_at TIMESTAMPTZ,                          -- cuándo el cliente confirmó
    notas         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: pedido_items (detalle de cada pedido)
-- ============================================================
CREATE TABLE pedido_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    -- guardamos el nombre y precio al momento del pedido (por si cambian después)
    producto_nombre VARCHAR(140) NOT NULL,
    cantidad        NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: inventario (control de existencias)
-- ============================================================
CREATE TABLE inventario (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id   UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
    stock_actual  NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_minimo  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- para alertas
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: conversaciones_wpp (estado del flujo de WhatsApp por cliente)
-- Permite que n8n recuerde en qué paso del pedido va cada cliente
-- ============================================================
CREATE TABLE conversaciones_wpp (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id    UUID REFERENCES clientes(id) ON DELETE CASCADE,
    telefono      VARCHAR(40) NOT NULL,
    -- paso actual del flujo: inicio, eligiendo_producto, eligiendo_cantidad, etc.
    estado_flujo  VARCHAR(50) NOT NULL DEFAULT 'inicio',
    -- pedido en construcción (JSON temporal mientras arma el pedido)
    carrito       JSONB DEFAULT '[]',
    pedido_id     UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    ultimo_mensaje_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES para mejorar el rendimiento de consultas frecuentes
-- ============================================================
CREATE INDEX idx_clientes_ruta        ON clientes(ruta_id);
CREATE INDEX idx_clientes_telefono    ON clientes(telefono);
CREATE INDEX idx_clientes_codigo_mek  ON clientes(codigo_mekano);
CREATE INDEX idx_precios_cliente_cli  ON precios_cliente(cliente_id);
CREATE INDEX idx_precios_cliente_prod ON precios_cliente(producto_id);
CREATE INDEX idx_pedidos_cliente      ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_fecha        ON pedidos(fecha_pedido);
CREATE INDEX idx_pedidos_estado       ON pedidos(estado);
CREATE INDEX idx_pedido_items_pedido  ON pedido_items(pedido_id);
CREATE INDEX idx_conv_telefono        ON conversaciones_wpp(telefono);

-- ============================================================
-- FUNCIÓN: actualizar automáticamente el campo updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at en las tablas que lo usan
CREATE TRIGGER trg_usuarios_updated   BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_empleados_updated  BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rutas_updated      BEFORE UPDATE ON rutas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clientes_updated   BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_updated  BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_precios_updated    BEFORE UPDATE ON precios_cliente
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedidos_updated    BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================