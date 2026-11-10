-- Ingreso al panel por número de documento. Cambio aditivo e idempotente:
-- la columna es opcional para no romper a los usuarios que aún no la tienen.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS documento VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_documento_key
  ON usuarios (documento)
  WHERE documento IS NOT NULL;
