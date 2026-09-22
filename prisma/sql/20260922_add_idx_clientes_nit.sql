-- Índice para acelerar el login de la tienda, que busca clientes por su NIT.
-- El proyecto usa introspección (prisma db pull), no Prisma Migrate, así que
-- este índice se aplica con SQL idempotente en vez de `prisma migrate dev`
-- (que sobre la BD de producción intentaría inicializar/rebasar el historial).
CREATE INDEX IF NOT EXISTS idx_clientes_nit ON clientes (nit);
