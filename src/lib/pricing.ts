import { SIZES, cardVariantCode, type Configuration, type Quantity, type SizeId, type Sides } from "@/lib/catalog";
import { deliveryOption, surchargeCents } from "@/lib/delivery";
import { finishCentsWithoutIva, runCentsWithoutIva, type FinishId } from "@/lib/matriz";
import { withIva } from "@/lib/tax";

/*
 * Precios de las tarjetas: salen de la matriz (producto TPR). La impresión a
 * 1 o 2 lados son variantes distintas; laminado, UV y puntas son recargos por
 * tirada de la hoja ACABADOS. Todo viene sin IVA y aquí se le suma.
 */
const CARD = "TPR";

function cardRunCents(sizeId: SizeId, sides: Sides, quantity: Quantity): number {
  return withIva(runCentsWithoutIva(CARD, cardVariantCode(sizeId, sides), quantity) ?? 0);
}

function cardFinishCents(sizeId: SizeId, sides: Sides, quantity: Quantity, finish: FinishId): number {
  return withIva(finishCentsWithoutIva(CARD, cardVariantCode(sizeId, sides), quantity, finish) ?? 0);
}

export type QuoteLine = {
  label: string;
  cents: number;
  included?: boolean;
};

export type Quote = {
  currency: "USD";
  baseCents: number;
  laminateCents: number;
  uvCents: number;
  cornersCents: number;
  deliveryCents: number;
  /** Solo la impresión y los acabados, sin el recargo de entrega. */
  printingCents: number;
  /** El total de esta tarjeta sola, con su recargo de entrega. */
  totalCents: number;
  /** Precio por tarjeta, sin el recargo: la entrega no cambia lo que cuesta imprimir. */
  unitCents: number;
  /** Los renglones de impresión, sin la entrega (va una sola vez por pedido). */
  printingLines: QuoteLine[];
  lines: QuoteLine[];
};

export function quote(config: Configuration): Quote {
  const { sizeId, sides, quantity } = config;
  const baseCents = cardRunCents(sizeId, sides, quantity);
  const laminateCents = config.laminate === "none" ? 0 : cardFinishCents(sizeId, sides, quantity, "laminado");
  const uvCents = config.uv ? cardFinishCents(sizeId, sides, quantity, "uv") : 0;
  const cornersCents = config.rounded ? cardFinishCents(sizeId, sides, quantity, "corte") : 0;
  const printingCents = baseCents + laminateCents + uvCents + cornersCents;
  const deliveryCents = surchargeCents(config.delivery, printingCents);
  const totalCents = printingCents + deliveryCents;

  const lines: QuoteLine[] = [
    {
      label: config.sides === 1 ? "Impresión a 1 lado" : "Impresión a 2 lados",
      cents: baseCents,
    },
    {
      label: config.paper === "mate" ? "Papel mate" : "Papel brillante",
      cents: 0,
      included: true,
    },
  ];

  if (config.laminate !== "none") {
    lines.push({
      label: config.laminate === "mate" ? "Laminado mate" : "Laminado brillante",
      cents: laminateCents,
    });
  }
  if (config.uv) lines.push({ label: "UV selectivo", cents: uvCents });
  if (config.rounded) lines.push({ label: "Puntas redondeadas", cents: cornersCents });
  const printingLines = [...lines];
  const speed = deliveryOption(config.delivery);
  lines.push({
    label: `Entrega ${speed.name}`,
    cents: deliveryCents,
    included: deliveryCents === 0,
  });

  return {
    currency: "USD",
    baseCents,
    laminateCents,
    uvCents,
    cornersCents,
    deliveryCents,
    printingCents,
    totalCents,
    unitCents: Math.round(printingCents / config.quantity),
    lines,
    printingLines,
  };
}

export function fromPrice(sizeId: SizeId): number {
  return cardRunCents(sizeId, 1, 50);
}

/** Lo que suma cada acabado con el tamaño, los lados y la cantidad elegidos. */
export function addonCents(sizeId: SizeId, quantity: Quantity, sides: Sides = 1) {
  return {
    laminate: cardFinishCents(sizeId, sides, quantity, "laminado"),
    uv: cardFinishCents(sizeId, sides, quantity, "uv"),
    corners: cardFinishCents(sizeId, sides, quantity, "corte"),
  };
}

export function describeConfiguration(config: Configuration): string {
  const size = SIZES[config.sizeId];
  const parts = [
    `${size.name} ${size.sizeLabel}`,
    `${config.quantity} u.`,
    config.sides === 1 ? "1 lado" : "2 lados",
    `papel ${config.paper}`,
  ];
  if (config.laminate !== "none") parts.push(`laminado ${config.laminate}`);
  if (config.uv) parts.push("UV selectivo");
  if (config.rounded) parts.push("puntas redondeadas");
  return parts.join(" · ");
}
