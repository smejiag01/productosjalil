-- 1) Número de WhatsApp de atención al cliente, editable desde Configuración.
--    Se guarda solo con dígitos y prefijo de país (ej. 573163332739). Lo usa el
--    botón "Soy cliente nuevo" del login de la tienda.
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS whatsapp_atencion VARCHAR(20);
UPDATE configuracion SET whatsapp_atencion = '573163332739' WHERE whatsapp_atencion IS NULL;

-- 2) Intentos fallidos de login de la tienda, para limitar la fuerza bruta.
--    "clave" es "ip:<ip>" o "nit:<nit>". Solo se registran fallos.
CREATE TABLE IF NOT EXISTS tienda_login_intentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave      VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tienda_login_intentos_clave
  ON tienda_login_intentos (clave, created_at);
