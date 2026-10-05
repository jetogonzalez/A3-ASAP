export function cleanText(input: string, max: number): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function safeFilename(input: string): string {
  const base = input.split(/[/\\]/).pop() ?? "arte";
  const cleaned = base
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^\p{L}\p{N} ._()-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || "arte";
}

export function luhnOk(num: string): boolean {
  const digits = num.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): string {
  const digits = num.replace(/\s+/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  return "Tarjeta";
}

export function last4(num: string): string {
  const digits = num.replace(/\D/g, "");
  return digits.slice(-4);
}

export function expiryOk(value: string, now = new Date()): boolean {
  const match = value.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const expiry = year * 12 + month;
  const current = now.getFullYear() * 12 + (now.getMonth() + 1);
  return expiry >= current;
}

export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[^\d+]/g, "");
  if (!/^(?:\+593|593|0)\d{8,9}$/.test(compact)) return null;
  if (compact.startsWith("+593")) return compact;
  if (compact.startsWith("593")) return `+${compact}`;
  return `+593${compact.slice(1)}`;
}
