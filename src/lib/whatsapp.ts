/**
 * El pedido se cierra por WhatsApp: la web arma la tanda y guarda el resumen,
 * y la conversación confirma el pago y cuánto cuesta llevarlo. El número va
 * igual al navegador, así que vive aquí; la variable de entorno solo sirve
 * para apuntar a otro número sin tocar el código.
 */
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "593992656521"
).replace(/\D/g, "");

export const PAYMENT_LABELS = {
  transfer: "Transferencia bancaria",
  deuna: "Deuna",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_LABELS;

export function whatsappHref(message: string): string {
  const text = encodeURIComponent(message);
  return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function orderMessage({
  number,
  name,
  total,
  payment,
  shipping,
  items,
}: {
  number: string;
  name: string;
  total: string;
  payment: PaymentMethod;
  shipping: string;
  items: string[];
}): string {
  return [
    `Hola, soy ${name}. Acabo de hacer el pedido ${number} en la web.`,
    "",
    ...items.map((item) => `• ${item}`),
    "",
    `Impresión: ${total}`,
    `Entrega: ${shipping}`,
    `Voy a pagar con ${PAYMENT_LABELS[payment]}.`,
    "",
    "¿Me confirman el costo del envío y los datos para pagar?",
  ].join("\n");
}
