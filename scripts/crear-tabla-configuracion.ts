import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS configuracion (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre_negocio VARCHAR(200) DEFAULT 'Productos Jalil',
      nit VARCHAR(40),
      direccion_negocio TEXT,
      telefono_negocio VARCHAR(40),
      hora_envio_recordatorio TIME DEFAULT '07:00',
      horas_espera_seguimiento INT DEFAULT 4,
      texto_recordatorio TEXT DEFAULT 'Hola {nombre}, te recordamos que hoy es día de pedido. ¿Deseas hacer tu pedido?',
      texto_seguimiento TEXT DEFAULT 'Hola {nombre}, aún no hemos recibido tu pedido de hoy. ¿Te gustaría ordenar algo?',
      updated_at TIMESTAMPTZ(6) DEFAULT NOW()
    )
  `);

  const existe = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as total FROM configuracion`
  ) as { total: bigint }[];

  if (Number(existe[0].total) === 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO configuracion (nombre_negocio) VALUES ('Productos Jalil')
    `);
    console.log("Registro de configuración creado.");
  } else {
    console.log("Registro de configuración ya existe.");
  }
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
