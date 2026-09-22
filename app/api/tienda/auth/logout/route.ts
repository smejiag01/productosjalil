import { NextResponse } from "next/server";
import {
  COOKIE_SESION_TIENDA,
  opcionesCookieSesion,
} from "@/lib/tienda-session";

export async function POST() {
  const respuesta = NextResponse.json({ success: true, data: { ok: true } });
  respuesta.cookies.set(COOKIE_SESION_TIENDA, "", opcionesCookieSesion(0));
  return respuesta;
}
