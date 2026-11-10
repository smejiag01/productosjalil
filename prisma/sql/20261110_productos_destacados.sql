-- Productos destacados de la tienda (/tienda): el admin los marca y ordena
-- desde Productos. Cambio aditivo e idempotente.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS orden_destacado INTEGER;

CREATE INDEX IF NOT EXISTS idx_productos_destacado
  ON productos (orden_destacado)
  WHERE destacado = true;
