import { notFound } from "next/navigation";
import ListaEntregas from "@/app/repartidor/ListaEntregas";
import NavegadorDias from "@/app/repartidor/NavegadorDias";

export const dynamic = "force-dynamic";

const hoy = "2026-11-04";

const base = { fecha: hoy, rutaId: "r1", rutaNombre: "Cartago", notas: null as string | null };

const entregas = [
  {
    ...base,
    id: "1",
    estado: "entregado",
    total: 185000,
    cliente: { nombre: "Carnes El Establo", telefono: "3001112233", sedeNombre: null, direccion: "Cra 5 # 10-20, Cartago", latitud: null, longitud: null },
    items: [{ id: "a", nombre: "Chuleta de cerdo", cantidad: 10 }],
  },
  {
    ...base,
    id: "2",
    estado: "confirmado",
    total: 342500,
    notas: "Entregar por la puerta de atrás, preguntar por Marta.",
    cliente: { nombre: "Restaurante La Brasa", telefono: "3104445566", sedeNombre: "Sede Norte", direccion: "Calle 12 # 3-45 Local 2, Cartago", latitud: 4.7463, longitud: -75.9116 },
    items: [
      { id: "b", nombre: "Costilla de res", cantidad: 8 },
      { id: "c", nombre: "Chorizo artesanal", cantidad: 20 },
    ],
  },
  {
    ...base,
    id: "3",
    estado: "en_reparto",
    total: 98000,
    cliente: { nombre: "Minimercado Don Pepe", telefono: "3207778899", sedeNombre: null, direccion: "Av. Las Américas # 22-10", latitud: null, longitud: null },
    items: [{ id: "d", nombre: "Pechuga de pollo", cantidad: 5 }],
  },
  {
    ...base,
    id: "4",
    estado: "devuelto",
    total: 54000,
    cliente: { nombre: "Tienda Doña Luz", telefono: "3151234567", sedeNombre: null, direccion: "Cra 8 # 4-12", latitud: null, longitud: null },
    items: [{ id: "e", nombre: "Morcilla", cantidad: 6 }],
  },
];

// Vista previa con datos de muestra de la app del repartidor (solo desarrollo)
export default function RepartidorDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="mx-auto max-w-lg bg-paper px-3 py-4">
      <h1 className="mb-4 font-display text-2xl font-semibold text-ink-900">Mis entregas</h1>
      <NavegadorDias modo="dia" fecha={hoy} hoy={hoy} />
      <ListaEntregas entregas={entregas} modo="dia" hoy={hoy} truncado={false} />
    </div>
  );
}
