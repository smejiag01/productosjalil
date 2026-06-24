import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const correo = "admin@productosjalil.com";
  const password = "admin123";
  const nombre = "Administrador";

  const existente = await prisma.usuarios.findUnique({
    where: { correo },
  });

  if (existente) {
    console.log(`El usuario ${correo} ya existe.`);
    return;
  }

  const password_hash = await hash(password, 12);

  const usuario = await prisma.usuarios.create({
    data: {
      nombre,
      correo,
      password_hash,
      rol: "admin",
      activo: true,
    },
  });

  console.log(`Usuario admin creado:`);
  console.log(`  Correo: ${correo}`);
  console.log(`  Contraseña: ${password}`);
  console.log(`  ID: ${usuario.id}`);
  console.log(`\n¡Cambia la contraseña después del primer login!`);
}

main()
  .catch((e) => {
    console.error("Error al crear el usuario admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
