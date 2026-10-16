import { z } from "zod";
import { addBusinessDays } from "@/lib/delivery";
import { configurationSchema } from "@/lib/schema";
import type { Configuration } from "@/lib/catalog";

/** Una cotización vale 15 días hábiles: los precios de la hoja PVP pueden cambiar. */
export const QUOTE_VALID_DAYS = 15;

const quotePayloadSchema = z.object({
  v: z.literal(1),
  issued: z.iso.datetime(),
  client: z.object({
    name: z.string().max(120),
    document: z.string().max(20),
  }),
  items: z.array(configurationSchema).min(1).max(20),
});

/**
 * Todo lo que hace falta para rearmar la cotización. No se guarda en ningún
 * servidor: va dentro del enlace y los precios se vuelven a sacar de la tabla.
 */
export type QuotePayload = {
  v: 1;
  issued: string;
  client: { name: string; document: string };
  items: Configuration[];
};

export function encodeQuote(payload: QuotePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeQuote(encoded: string): QuotePayload | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = quotePayloadSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** El mismo contenido da siempre el mismo número, así el enlace compartido no lo cambia. */
export function quoteNumber(payload: QuotePayload): string {
  const source = JSON.stringify({ issued: payload.issued, items: payload.items });
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const day = payload.issued.slice(2, 10).replace(/-/g, "");
  return `COT-${day}-${hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

export function quoteValidUntil(issuedIso: string): string {
  return addBusinessDays(issuedIso, QUOTE_VALID_DAYS);
}
