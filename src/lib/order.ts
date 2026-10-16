import type { Configuration } from "@/lib/catalog";
import { deliveryWindow, fastestDelivery } from "@/lib/delivery";
import { shippingQuote, type ShippingQuote } from "@/lib/ecuador";
import { quote, type QuoteLine } from "@/lib/pricing";
import { ivaBreakdown } from "@/lib/tax";
import type { DocumentType } from "@/lib/text";
import { cartGrams } from "@/lib/weight";

export type OrderArtwork = { url: string; filename: string };

export type OrderDelivery = {
  id: string;
  name: string;
  cents: number;
  earliest: string;
  latest: string;
};

/**
 * Lo que cuesta un pedido entero. La impresión se suma tarjeta por tarjeta;
 * el recargo de entrega y el envío van una sola vez, porque todo sale junto.
 */
export type OrderTotals = {
  printingCents: number;
  delivery: OrderDelivery;
  shipping: ShippingQuote;
  /** Todo va con IVA; esto lo separa para la factura. */
  iva: { baseCents: number; ivaCents: number };
  totalCents: number;
};

export function orderTotals(configs: Configuration[], orderedAtIso: string): OrderTotals {
  const printingCents = configs.reduce((sum, config) => sum + quote(config).printingCents, 0);
  const speed = fastestDelivery(configs.map((config) => config.delivery));
  const window = deliveryWindow(orderedAtIso, speed.id);
  const delivery: OrderDelivery = {
    id: speed.id,
    name: speed.name,
    cents: configs.length > 0 ? speed.cents : 0,
    earliest: window.earliest,
    latest: window.latest,
  };
  const shipping = shippingQuote(cartGrams(configs));
  const totalCents = printingCents + delivery.cents + (configs.length > 0 ? shipping.cents : 0);
  return { printingCents, delivery, shipping, iva: ivaBreakdown(totalCents), totalCents };
}

export type PaymentMethod = "transfer" | "deuna";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transfer: "Transferencia bancaria",
  deuna: "Deuna",
};

/**
 * El pedido ya calculado por el servidor. No se guarda en ninguna base: viaja
 * al navegador para el recibo y de ahí, escrito, al WhatsApp de la tienda.
 */
export type Order = OrderTotals & {
  number: string;
  createdAt: string;
  items: Array<{
    description: string;
    quantity: number;
    printingCents: number;
    lines: QuoteLine[];
    artwork: OrderArtwork | null;
  }>;
  customer: {
    name: string;
    document: { type: DocumentType; label: string; number: string };
    email: string;
    phone: string;
    city: string;
    address: string;
    reference: string;
  };
  payment: { method: PaymentMethod; label: string };
  notes: string;
};

export function orderNumber(id: string): string {
  return `ASAP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
