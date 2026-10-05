"use server";

import { headers } from "next/headers";
import { isServicePlace, shippingQuote, type ShippingMethod } from "@/lib/ecuador";
import { describeConfiguration, quote } from "@/lib/pricing";
import { cartSchema, type OrderState } from "@/lib/schema";
import {
  cleanText,
  documentOk,
  DOCUMENT_TYPES,
  isDocumentType,
  normalizePhone,
  safeFilename,
} from "@/lib/text";
import { rateLimit } from "@/server/rate-limit";
import { saveOrder, saveUpload, verifyUpload, type StoredOrder } from "@/server/store";

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

export async function uploadArtwork(formData: FormData): Promise<
  | { ok: true; id: string; token: string; filename: string }
  | { ok: false; message: string }
> {
  const key = await clientKey();
  if (!rateLimit(`upload:${key}`, 20, 10 * 60 * 1000)) {
    return { ok: false, message: "Demasiados archivos seguidos. Espera unos minutos." };
  }
  const file = formData.get("artwork");
  if (!(file instanceof File)) {
    return { ok: false, message: "Adjunta un PDF, PNG o JPG." };
  }
  return saveUpload(file, safeFilename(file.name));
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
  const method: ShippingMethod = "envio";
  let city = "";
  if (!isServicePlace(citySelect)) fieldErrors.city = "Elige Quito o uno de los valles";
  else city = citySelect;
  if (address.length < 5) fieldErrors.address = "Escribe la calle, número y sector";

  /*
   * El cobro se cierra por WhatsApp: aquí solo se guarda con qué va a pagar.
   * No hay pasarela ni datos de tarjeta de por medio.
   */
  const pay = paymentMethod === "transfer" || paymentMethod === "deuna" ? paymentMethod : null;
  if (!pay) fieldErrors.paymentMethod = "Elige cómo vas a pagar";
  const paymentLabel = pay === "deuna" ? "Deuna" : "Transferencia bancaria";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, message: "Revisa los campos marcados." };
  }

  const items: StoredOrder["items"] = [];
  for (const item of cart.data) {
    const priced = quote(item.configuration);
    let artwork = null;
    if (item.artwork) {
      artwork = await verifyUpload(item.artwork.id, item.artwork.token, item.artwork.filename);
      if (!artwork) {
        return {
          ok: false,
          fieldErrors: { cart: "Uno de los archivos ya no está disponible. Vuelve a adjuntarlo." },
        };
      }
    }
    items.push({
      description: describeConfiguration(item.configuration),
      quantity: item.configuration.quantity,
      totalCents: priced.totalCents,
      lines: priced.lines,
      artwork,
    });
  }

  const shipping = shippingQuote();
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const id = crypto.randomUUID();
  const order: StoredOrder = {
    id,
    number: `ASAP-${id.slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    items,
    customer: {
      name: `${firstName} ${lastName}`,
      document: { type: documentType, label: documentLabel, number: documentNumber },
      email,
      phone: phone!,
      province: "Pichincha",
      city,
      address,
      reference,
    },
    shipping: { method, ...shipping },
    payment: { method: pay!, label: paymentLabel },
    notes,
    subtotalCents,
    totalCents: subtotalCents + shipping.cents,
  };

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("order_save_failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, message: "No pudimos guardar el pedido en este equipo. Inténtalo de nuevo." };
  }

  return { ok: true, orderId: id };
}
