/**
 * IVA de Ecuador: 15 % desde abril de 2024. La hoja PVP, la mensajería y los
 * recargos de entrega están sin IVA; al cliente siempre se le muestra el
 * precio final con el impuesto, como pide la Ley de Defensa del Consumidor.
 */
export const IVA_PERCENT = 15;
export const IVA_LABEL = `IVA ${IVA_PERCENT} %`;

/**
 * Un valor sin IVA, ya con el impuesto, redondeado al centavo. Se calcula en
 * enteros: 350 × 1.15 en coma flotante da 402.4999… y redondeaba para abajo.
 */
export function withIva(baseCents: number): number {
  return Math.round((baseCents * (100 + IVA_PERCENT)) / 100);
}

/**
 * Separa un total con IVA en base e impuesto para la factura. La base se
 * redondea y el IVA es la diferencia, así base + IVA siempre da el total.
 */
export function ivaBreakdown(totalCents: number): { baseCents: number; ivaCents: number } {
  const baseCents = Math.round((totalCents * 100) / (100 + IVA_PERCENT));
  return { baseCents, ivaCents: totalCents - baseCents };
}
