import { z } from "zod";

export const configurationSchema = z.object({
  sizeId: z.enum(["85x55", "55x55"]),
  quantity: z.union([
    z.literal(50),
    z.literal(100),
    z.literal(250),
    z.literal(500),
    z.literal(1000),
  ]),
  sides: z.union([z.literal(1), z.literal(2)]),
  paper: z.enum(["mate", "brillante"]),
  laminate: z.enum(["none", "mate", "brillante"]),
  uv: z.boolean(),
  rounded: z.boolean(),
  delivery: z.enum(["standard", "priority", "express"]).default("standard"),
});

export const artworkRefSchema = z
  .object({
    id: z.uuid(),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    filename: z.string().regex(/^[\p{L}\p{N} ._()-]{1,80}$/u),
  })
  .nullable();

export const cartItemSchema = z.object({
  id: z.uuid(),
  configuration: configurationSchema,
  artwork: artworkRefSchema,
});

export const cartSchema = z.array(cartItemSchema).max(20);

export type CartItemInput = z.infer<typeof cartItemSchema>;

export type OrderState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  orderId?: string;
};

export const initialOrderState: OrderState = { ok: false };

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
