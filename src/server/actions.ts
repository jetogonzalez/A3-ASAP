"use server";

import { headers } from "next/headers";
import { isServicePlace } from "@/lib/ecuador";
import { orderNumber, orderTotals, PAYMENT_LABELS, type Order } from "@/lib/order";
import { describeConfiguration, quote } from "@/lib/pricing";
import { cartSchema, type OrderState } from "@/lib/schema";
import { cleanText, documentOk, DOCUMENT_TYPES, isDocumentType, normalizePhone } from "@/lib/text";
import { rateLimit } from "@/server/rate-limit";

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const raw = forwarded || headerList.get("x-real-ip") || "local";
  return raw.replace(/[^\w.:]/g, "").slice(0, 64) || "local";
}

function readField(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return cleanText(value, max);
}

export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const key = await clientKey();
  if (!rateLimit(`order:${key}`, 8, 10 * 60 * 1000)) {
    return { ok: false, message: "Demasiados intentos. Espera unos minutos y vuelve a enviar." };
  }
  if (readField(formData, "company_website", 200)) {
    return { ok: false, message: "No pudimos recibir el pedido." };
  }
  const termsAccepted = formData.get("terms") === "yes";
  const cartRaw = formData.get("cart");
  if (typeof cartRaw !== "string" || cartRaw.length > 100_000) {
    return { ok: false, fieldErrors: { cart: "El pedido no es válido. Vuelve al carrito." } };
  }
  let cartJson: unknown;
  try {
    cartJson = JSON.parse(cartRaw);
  } catch {
    return { ok: false, fieldErrors: { cart: "El pedido no es válido. Vuelve al carrito." } };
  }
  const cart = cartSchema.safeParse(cartJson);
  if (!cart.success || cart.data.length === 0) {
    return { ok: false, fieldErrors: { cart: "Agrega al menos un producto antes de pagar." } };
  }

  const firstName = readField(formData, "firstName", 60);
  const lastName = readField(formData, "lastName", 60);
  const documentTypeInput = readField(formData, "documentType", 20);
  const documentNumber = readField(formData, "documentNumber", 20).toUpperCase();
  const email = readField(formData, "email", 120).toLowerCase();
  const phoneInput = readField(formData, "phone", 20);
  const citySelect = readField(formData, "city", 80);
  const address = readField(formData, "address", 160);
  const reference = readField(formData, "reference", 120);
  const notes = readField(formData, "notes", 400);
  const paymentMethod = readField(formData, "paymentMethod", 20);

  const fieldErrors: Record<string, string> = {};
  if (!termsAccepted) fieldErrors.terms = "Confirma que revisaste el pedido";
  if (firstName.length < 2) fieldErrors.firstName = "Escribe tus nombres";
  if (lastName.length < 2) fieldErrors.lastName = "Escribe tus apellidos";

  /* El documento va en la factura, así que se revisa aquí y no solo en el navegador. */
  const documentType = isDocumentType(documentTypeInput) ? documentTypeInput : "cedula";
  const documentLabel =
    DOCUMENT_TYPES.find((type) => type.id === documentType)?.label ?? "Cédula";
  if (!documentOk(documentType, documentNumber)) {
    fieldErrors.documentNumber =
      documentType === "cedula"
        ? "La cédula no es válida, son 10 dígitos"
        : documentType === "ruc"
          ? "El RUC no es válido, son 13 dígitos y termina en 001"
          : "Escribe el número del pasaporte";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    fieldErrors.email = "El correo no es válido";
  }
  const phone = normalizePhone(phoneInput);
  if (!phone) fieldErrors.phone = "Usa un teléfono de Ecuador, como 0991234567";

  /* Todo va a domicilio, así que el sector y la dirección siempre hacen falta. */
  let city = "";
  if (!isServicePlace(citySelect)) fieldErrors.city = "Elige Quito o uno de los valles";
  else city = citySelect;
  if (address.length < 5) fieldErrors.address = "Escribe la calle, número y sector";

  /*
   * El cobro se cierra por WhatsApp: aquí solo se anota con qué va a pagar.
   * No hay pasarela ni datos de tarjeta de por medio.
   */
  const pay = paymentMethod === "transfer" || paymentMethod === "deuna" ? paymentMethod : null;
  if (!pay) fieldErrors.paymentMethod = "Elige cómo vas a pagar";

  if (Object.keys(fieldErrors).length > 0 || !pay || !phone) {
    return { ok: false, fieldErrors, message: "Revisa los campos marcados." };
  }

  /*
   * El precio se vuelve a sacar aquí, con la tabla del servidor: lo que venga
   * calculado del navegador no cuenta. El pedido no se guarda en ninguna base;
   * vuelve armado al navegador y de ahí va escrito al WhatsApp de la tienda.
   */
  const configs = cart.data.map((item) => item.configuration);
  const createdAt = new Date().toISOString();
  const order: Order = {
    number: orderNumber(crypto.randomUUID()),
    createdAt,
    ...orderTotals(configs, createdAt),
    items: cart.data.map((item) => {
      const priced = quote(item.configuration);
      return {
        description: describeConfiguration(item.configuration),
        quantity: item.configuration.quantity,
        printingCents: priced.printingCents,
        lines: priced.printingLines,
        artwork: item.artwork,
      };
    }),
    customer: {
      name: `${firstName} ${lastName}`,
      document: { type: documentType, label: documentLabel, number: documentNumber },
      email,
      phone,
      city,
      address,
      reference,
    },
    payment: { method: pay, label: PAYMENT_LABELS[pay] },
    notes,
  };

  return { ok: true, order };
}
