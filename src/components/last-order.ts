import type { Order } from "@/lib/order";

/*
 * El pedido no vive en ningún servidor: el recibo lo lee de este navegador.
 * Si la persona va a WhatsApp y vuelve más tarde, lo sigue encontrando aquí.
 */
const STORAGE_KEY = "asap-last-order-v1";

export function rememberOrder(order: Order): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* Sin almacenamiento el recibo no se puede volver a abrir, pero el pedido ya salió. */
  }
}

export function readLastOrder(): Order | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isOrder(value: unknown): value is Order {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Order>;
  return (
    typeof candidate.number === "string" &&
    Array.isArray(candidate.items) &&
    typeof candidate.totalCents === "number" &&
    typeof candidate.iva === "object" &&
    typeof candidate.customer === "object"
  );
}
