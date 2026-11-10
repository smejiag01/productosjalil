import { MANIFIESTO_PERSONAL, respuestaManifiesto } from "@/lib/manifiestos";

export function GET() {
  return respuestaManifiesto(MANIFIESTO_PERSONAL);
}
