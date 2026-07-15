const WEBHOOK_DESPACHO_URL = "https://n8n.smejia.com/webhook/jalil-notificar-despacho";
const TIMEOUT_MS = 5000;

interface PedidoNotificable {
  telefono: string;
  clienteNombre: string;
}

/**
 * Notifica a n8n que uno o más pedidos pasaron a "en_reparto" para que
 * envíe el WhatsApp "tu pedido está en camino". Best-effort: un fallo aquí
 * nunca debe tumbar la respuesta del endpoint que llama (el cambio de
 * estado en base de datos ya se hizo).
 */
export async function notificarDespachoWhatsApp(
  pedidos: PedidoNotificable[]
): Promise<void> {
  if (pedidos.length === 0) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    await fetch(WEBHOOK_DESPACHO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedidos: pedidos.map((p) => ({
          telefono: p.telefono,
          cliente_nombre: p.clienteNombre,
        })),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Error al notificar despacho por WhatsApp:", error);
  } finally {
    clearTimeout(timeoutId);
  }
}
