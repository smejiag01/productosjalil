-- Informe diario de visitas de los vendedores (reemplaza el formato en papel).
-- Los ids los genera el celular (UUID) para poder registrar sin señal y
-- reenviar después sin duplicar: los inserts usan ON CONFLICT (id) DO NOTHING.

-- Un "día de visitas": se inicia y se finaliza desde la app del vendedor.
CREATE TABLE IF NOT EXISTS jornadas_visita (
  id           UUID PRIMARY KEY,
  vendedor_id  UUID         NOT NULL REFERENCES usuarios(id),
  fecha        DATE         NOT NULL,
  ciudad       VARCHAR(120) NOT NULL,
  inicio_at    TIMESTAMPTZ  NOT NULL,
  fin_at       TIMESTAMPTZ,
  inicio_lat   DOUBLE PRECISION,
  inicio_lng   DOUBLE PRECISION,
  fin_lat      DOUBLE PRECISION,
  fin_lng      DOUBLE PRECISION,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jornadas_visita_vendedor_fecha
  ON jornadas_visita (vendedor_id, fecha DESC);

-- Cada negocio visitado dentro de una jornada.
CREATE TABLE IF NOT EXISTS visitas (
  id                     UUID PRIMARY KEY,
  jornada_id             UUID         NOT NULL REFERENCES jornadas_visita(id) ON DELETE CASCADE,
  vendedor_id            UUID         NOT NULL REFERENCES usuarios(id),
  registrada_at          TIMESTAMPTZ  NOT NULL,
  nicho                  VARCHAR(60)  NOT NULL,
  nombre_empresa         VARCHAR(160) NOT NULL,
  direccion              TEXT,
  telefono               VARCHAR(40),
  contacto               VARCHAR(120),
  observaciones          TEXT,
  latitud                DOUBLE PRECISION,
  longitud               DOUBLE PRECISION,
  precision_m            DOUBLE PRECISION,
  cliente_id             UUID REFERENCES clientes(id) ON DELETE SET NULL,
  contacto_pendiente_id  UUID REFERENCES contactos_pendientes(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visitas_jornada ON visitas (jornada_id);
CREATE INDEX IF NOT EXISTS idx_visitas_vendedor_fecha ON visitas (vendedor_id, registrada_at DESC);
