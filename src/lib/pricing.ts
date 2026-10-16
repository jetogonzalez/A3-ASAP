import {
  PRICE_BOOK,
  SIZES,
  type Configuration,
  type Quantity,
  type SizeId,
} from "@/lib/catalog";
import { toCents } from "@/lib/money";
import { deliveryOption } from "@/lib/delivery";

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
  const tier = PRICE_BOOK[config.sizeId][config.quantity];
  const baseCents = toCents(config.sides === 1 ? tier.one : tier.two);
  const laminateCents = config.laminate === "none" ? 0 : toCents(tier.laminate);
  const uvCents = config.uv ? toCents(tier.uv) : 0;
  const cornersCents = config.rounded ? toCents(tier.corners) : 0;
  const deliveryCents = deliveryOption(config.delivery).cents;
  const printingCents = baseCents + laminateCents + uvCents + cornersCents;
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
    label: `Entrega ${speed.name.toLowerCase()}`,
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
  return toCents(PRICE_BOOK[sizeId][50].one);
}

export function addonCents(sizeId: SizeId, quantity: Quantity) {
  const tier = PRICE_BOOK[sizeId][quantity];
  return {
    laminate: toCents(tier.laminate),
    uv: toCents(tier.uv),
    corners: toCents(tier.corners),
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
