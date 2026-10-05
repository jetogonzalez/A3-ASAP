const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Half-up to cents. Avoids binary float drift on the sheet decimals. */
export function toCents(amount: string): number {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Precio inválido: ${amount}`);
  }
  const [whole, fraction = ""] = normalized.split(".");
  const digits = `${fraction}000`.slice(0, 3);
  let cents = Number(whole) * 100 + Number(digits.slice(0, 2));
  if (Number(digits[2]) >= 5) cents += 1;
  return cents;
}

export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}
