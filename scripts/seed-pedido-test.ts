import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ruta = await prisma.rutas.create({
    data: {
      nombre: "Ruta Centro",
      descripcion: "Zona centro de la ciudad",
      dias_semana: [new Date().getDay()],
      activa: true,
    },
  });

  const cliente = await prisma.clientes.create({
    data: {
      nombre: "Restaurante La Hacienda",
      telefono: "+57 310 234 5678",
      direccion: "Cra 45 #12-34, Centro",
      codigo_mekano: "MK-0145",
      ruta_id: ruta.id,
      activo: true,
    },
  });

  const productos = await Promise.all([
    prisma.productos.create({
      data: { nombre: "Arrachera", unidad: "kg", precio_base: 32000, orden: 1, activo: true },
    }),
    prisma.productos.create({
      data: { nombre: "Costilla de res", unidad: "kg", precio_base: 24000, orden: 2, activo: true },
    }),
    prisma.productos.create({
      data: { nombre: "Molida especial", unidad: "kg", precio_base: 28000, orden: 3, activo: true },
    }),
    prisma.productos.create({
      data: { nombre: "Chorizo artesanal", unidad: "kg", precio_base: 18000, orden: 4, activo: true },
    }),
    prisma.productos.create({
      data: { nombre: "Pollo entero", unidad: "kg", precio_base: 13500, orden: 5, activo: true },
    }),
  ]);

  const items = [
    { producto: productos[0], cantidad: 12, precio: 32000 },
    { producto: productos[1], cantidad: 8, precio: 24000 },
    { producto: productos[2], cantidad: 10, precio: 28000 },
    { producto: productos[3], cantidad: 6, precio: 18000 },
    { producto: productos[4], cantidad: 9, precio: 13500 },
  ];

  const total = items.reduce((s, i) => s + i.cantidad * i.precio, 0);

  const pedido = await prisma.pedidos.create({
    data: {
      cliente_id: cliente.id,
      ruta_id: ruta.id,
      estado: "pendiente",
      total,
      fecha_pedido: new Date(new Date().toISOString().split("T")[0]),
      items: {
        create: items.map((i) => ({
          producto_id: i.producto.id,
          producto_nombre: i.producto.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
          subtotal: i.cantidad * i.precio,
        })),
      },
    },
  });

  // Segundo pedido confirmado
  const cliente2 = await prisma.clientes.create({
    data: {
      nombre: "Carnes Don Nacho",
      telefono: "+57 320 456 7890",
      direccion: "Av Principal #78-90",
      codigo_mekano: "MK-0146",
      ruta_id: ruta.id,
      activo: true,
    },
  });

  const items2 = [
    { producto: productos[0], cantidad: 5, precio: 32000 },
    { producto: productos[3], cantidad: 8, precio: 18000 },
  ];
  const total2 = items2.reduce((s, i) => s + i.cantidad * i.precio, 0);

  await prisma.pedidos.create({
    data: {
      cliente_id: cliente2.id,
      ruta_id: ruta.id,
      estado: "confirmado",
      total: total2,
      fecha_pedido: new Date(new Date().toISOString().split("T")[0]),
      confirmado_at: new Date(),
      items: {
        create: items2.map((i) => ({
          producto_id: i.producto.id,
          producto_nombre: i.producto.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
          subtotal: i.cantidad * i.precio,
        })),
      },
    },
  });

  console.log("Datos de prueba creados:");
  console.log(`  Ruta: ${ruta.nombre}`);
  console.log(`  Clientes: ${cliente.nombre}, ${cliente2.nombre}`);
  console.log(`  Productos: ${productos.length}`);
  console.log(`  Pedido 1 (pendiente): $${total.toLocaleString()}`);
  console.log(`  Pedido 2 (confirmado): $${total2.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
