import { notFound } from "next/navigation";
import UiKitDemo from "./UiKitDemo";

export const dynamic = "force-dynamic";

// Galería de componentes solo para desarrollo: en producción no existe.
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiKitDemo />;
}
