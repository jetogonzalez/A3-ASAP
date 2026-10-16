import { formatLongDate, formatShortDate } from "@/lib/delivery";
import { formatUsd } from "@/lib/money";
import type { Order } from "@/lib/order";
import { formatWeight } from "@/lib/weight";

/**
 * El pedido se cierra por WhatsApp: la web calcula todo y el mensaje lleva lo
 * que la tienda necesita para cobrar, facturar, imprimir y despachar. El
 * número va igual al navegador; la variable de entorno solo sirve para
 * apuntar a otro número sin tocar el código.
 */
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "593992656521"
).replace(/\D/g, "");

export function whatsappHref(message: string): string {
  const text = encodeURIComponent(message);
  return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function orderMessage(order: Order): string {
  const missingArtwork = order.items.some((item) => !item.artwork);
  const { customer } = order;

  const items = order.items.flatMap((item, index) => [
    `${index + 1}. ${item.description} — ${formatUsd(item.printingCents)}`,
    item.artwork ? `   Arte: ${item.artwork.url}` : "   Arte: lo envío en este chat",
  ]);

  const delivery =
    order.delivery.cents > 0
      ? `Entrega ${order.delivery.name.toLowerCase()}: ${formatUsd(order.delivery.cents)}`
      : `Entrega ${order.delivery.name.toLowerCase()}: incluida`;

  return [
    `Hola ASAP, quiero confirmar el pedido *${order.number}*.`,
    "",
    "*Pedido*",
    ...items,
    "",
    `Impresión: ${formatUsd(order.printingCents)}`,
    delivery,
    `Envío (${formatWeight(order.shipping.grams)}): ${formatUsd(order.shipping.cents)}`,
    `*Total: ${formatUsd(order.totalCents)}*`,
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

/** Para pedir a la tienda la cotización formal de lo que ya se armó en la web. */
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
    `Hola ASAP, ¿me pueden enviar la cotización *${number}*?`,
    "",
    ...items.map((item) => `• ${item}`),
    `*Total: ${total}*`,
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
