import type { Configuration } from "@/lib/catalog";

/*
 * Código de cada línea de la proforma y del pedido, en el mismo estilo que los
 * price_id de la matriz de productos (producto-variante-cantidad). Se arma de
 * la configuración, así el mismo pedido da siempre el mismo código:
 *
 *   TPR-8555-2L-M-LM-UV-R-0500
 *   │   │    │  │ │  │  │ └ cantidad
 *   │   │    │  │ │  │  └ puntas redondeadas
 *   │   │    │  │ │  └ UV selectivo
 *   │   │    │  │ └ laminado mate (LM) o brillante (LB)
 *   │   │    │  └ papel mate (M) o brillante (B)
 *   │   │    └ lados impresos
 *   │   └ tamaño en mm (85×55 o 55×55)
 *   └ tarjetas de presentación
 */
export function skuFor(config: Configuration): string {
  const parts = [
    "TPR",
    config.sizeId.replace("x", ""),
    `${config.sides}L`,
    config.paper === "mate" ? "M" : "B",
  ];
  if (config.laminate !== "none") parts.push(config.laminate === "mate" ? "LM" : "LB");
  if (config.uv) parts.push("UV");
  if (config.rounded) parts.push("R");
  parts.push(String(config.quantity).padStart(4, "0"));
  return parts.join("-");
}
