import { formatLongDate, formatShortDate } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import type { Order } from "@/lib/order";
import { IVA_LABEL } from "@/lib/tax";
import { formatWeight } from "@/lib/weight";

/**
 * El pedido se cierra por WhatsApp: la web calcula todo y el mensaje lleva lo
 * que la tienda necesita para cobrar, facturar, imprimir y despachar.
 *
 * El número de la tienda vive aquí y no en una variable de entorno: así no
 * hay un valor viejo en Vercel que lo pise sin que nadie lo note.
 * 096 295 6566 en Ecuador, con el código de país y sin el 0.
 */
export const WHATSAPP_NUMBER = "593962956566";

export function whatsappHref(message: string): string {
  const text = encodeURIComponent(message);
  return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function orderMessage(order: Order): string {
  const missingArtwork = order.items.some((item) => !item.artwork);
  const { customer } = order;

  const items = order.items.flatMap((item, index) => [
    `${index + 1}. ${item.description} — ${formatUsd(item.printingCents)}`,
    !item.artwork
      ? "   Arte: lo envío en este chat"
      : item.artwork.source === "canva"
        ? `   Diseño en Canva: ${item.artwork.url}`
        : `   Arte: ${item.artwork.url}`,
  ]);

  const delivery =
    order.delivery.cents > 0
      ? `Entrega ${order.delivery.name}: ${formatUsd(order.delivery.cents)}`
      : `Entrega ${order.delivery.name}: incluida`;

  return [
    `Hola ASAP, quiero confirmar el pedido *${order.number}*.`,
    "",
    "*Pedido*",
    ...items,
    "",
    `Impresión: ${formatUsd(order.printingCents)}`,
    delivery,
    `Envío (${formatWeight(order.shipping.grams)}): ${formatUsd(order.shipping.cents)}`,
    `Subtotal sin IVA: ${formatUsd(order.iva.baseCents)}`,
    `${IVA_LABEL}: ${formatUsd(order.iva.ivaCents)}`,
    `*Total con IVA: ${formatUsd(order.totalCents)}*`,
    `Llega entre el ${formatLongDate(order.delivery.earliest)} y el ${formatShortDate(order.delivery.latest)}.`,
    "",
    "*Factura*",
    customer.name,
    `${customer.document.label}: ${customer.document.number}`,
    customer.email,
    customer.phone,
    "",
    "*Entrega en*",
    `${customer.address}, ${customer.city}`,
    ...(customer.reference ? [`Referencia: ${customer.reference}`] : []),
    "",
    `*Pago:* ${order.payment.label}`,
    ...(order.notes ? ["", `*Nota:* ${order.notes}`] : []),
    "",
    missingArtwork
      ? "¿Me pasan los datos para pagar? Enseguida les mando el archivo de diseño."
      : "¿Me pasan los datos para pagar?",
  ].join("\n");
}

/** Para pedir a la tienda la proforma formal de lo que ya se armó en la web. */
export function quoteRequestMessage({
  number,
  clientName,
  clientDocument,
  items,
  total,
  link,
}: {
  number: string;
  clientName: string;
  clientDocument: string;
  items: string[];
  total: string;
  link: string;
}): string {
  return [
    `Hola ASAP, ¿me pueden enviar la proforma *${number}*?`,
    "",
    ...items.map((item) => `• ${item}`),
    `*Total con IVA: ${total}*`,
    "",
    ...(clientName ? [`A nombre de: ${clientName}`] : []),
    ...(clientDocument ? [`RUC o cédula: ${clientDocument}`] : []),
    `Detalle: ${link}`,
  ].join("\n");
}

/** Para lo que todavía no se arma en la web: se cotiza conversando. */
export function customQuoteMessage(product: string): string {
  return `Hola ASAP, quiero cotizar ${product}. ¿Me ayudan?`;
}
