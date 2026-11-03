-- Ubicación del cliente en el mapa (se elige en el formulario con Google Maps).
-- Las sedes ya tenían latitud/longitud; ahora el cliente también.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS latitud  DOUBLE PRECISION;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;
