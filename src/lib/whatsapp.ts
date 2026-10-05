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
  printing,
  shipping,
  total,
  payment,
  items,
}: {
  number: string;
  name: string;
  printing: string;
  shipping: string;
  total: string;
  payment: PaymentMethod;
  items: string[];
}): string {
  /* El total ya viene cerrado desde la web: el chat solo sirve para pagar. */
  return [
    `Hola, soy ${name}. Acabo de hacer el pedido ${number} en la web.`,
    "",
    ...items.map((item) => `• ${item}`),
    "",
    `Impresión: ${printing}`,
    `Envío: ${shipping}`,
    `Total: ${total}`,
    `Voy a pagar con ${PAYMENT_LABELS[payment]}.`,
    "",
    "¿Me pasan los datos para pagar?",
  ].join("\n");
}
